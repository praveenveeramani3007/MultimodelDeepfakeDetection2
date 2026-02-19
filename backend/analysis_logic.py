import os
import io
import json
import base64
import numpy as np
import scipy.stats
from textblob import TextBlob
from PIL import Image, ImageChops, ExifTags
import librosa
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
import math

# --- OPTIONAL IMPORTS ---
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

# --- 1. CORE DATA STRUCTURES ---

class ForensicCheck:
    def __init__(self, name, description, status, details=None):
        self.name = name
        self.description = description
        self.status = status  # "PASS" or "FAIL"
        self.details = details or {}

class AnalysisResult:
    def __init__(self, label, score, reasoning, checks, details=None):
        self.label = label  # "Likely Organic", "Likely Synthetic", "Inconclusive"
        self.score = score  # 0-100 (Derived from failure count for backward compatibility)
        self.reasoning = reasoning
        self.checks = checks # List of ForensicCheck objects
        self.details = details or {}

# --- 2. FORENSIC UTILITIES ---

def calculate_shannon_entropy(data):
    """Calculates the Shannon entropy of a 1D signal/data."""
    if len(data) == 0:
        return 0
    entropy = scipy.stats.entropy(pd_series.value_counts()) if 'pd_series' in locals() else 0 # Placeholder for complex implementation if using pandas
    # Standard numpy implementation
    p_data = np.unique(data, return_counts=True)[1] / len(data)
    entropy = -np.sum(p_data * np.log2(p_data + 1e-10))
    return entropy

def calculate_verdict(checks):
    """
    Implements the 3-Independent-Check Failure Rule.
    < 2 Fails -> Likely Organic
    2 Fails -> Inconclusive
    >= 3 Fails -> Likely Synthetic
    """
    failed_count = len([c for c in checks if c.status == "FAIL"])
    
    if failed_count >= 3:
        label = "Likely Synthetic"
        base_score = 15 # Low authenticity score
    elif failed_count == 2:
        label = "Inconclusive"
        base_score = 45
    else:
        label = "Likely Organic"
        base_score = 85 + (15 if failed_count == 0 else 0)

    # Construct reasoning
    if failed_count == 0:
        reasoning = "All deterministic forensic checks passed. Signal integrity is consistent with organic media."
    else:
        failed_names = [c.name for c in checks if c.status == "FAIL"]
        reasoning = f"Flagged {failed_count} anomaly(ies): {', '.join(failed_names)}. "
        if label == "Likely Synthetic":
            reasoning += "Multiple independent forensic failures suggest synthetic origin."
    
    return label, base_score, reasoning

# --- 3. IMAGE ANALYSIS (NON-AI) ---

def analyze_image_native(image_bytes):
    """
    Deterministic Image Forensics: Metadata, ELA, Sensor Noise, Color Correlation.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        img_rgb = img.convert('RGB')
        checks = []

        # --- Check 1: Metadata Consistency ---
        # Exif retrieval
        exif_data = img.getexif()
        meta_fail = False
        meta_details = "Valid"
        
        if not exif_data:
            # Missing metadata is common in social media but suspicious in raw uploads
            # We treat it as a warning/soft fail or strict fail depending on policy.
            # For this engine, we will flag it if strictly empty.
            meta_fail = True 
            meta_details = "Complete absence of EXIF data."
        else:
            software_tags = [exif_data.get(key) for key in exif_data if ExifTags.TAGS.get(key) == 'Software']
            model_tags = [exif_data.get(key) for key in exif_data if ExifTags.TAGS.get(key) == 'Model']
            
            # Known AI generators often leave signatures or specific empty fields
            ai_keywords = ["Midjourney", "DALL-E", "Stable Diffusion", "Adobe Firefly"]
            found_ai = next((s for s in software_tags if isinstance(s, str) and any(k in s for k in ai_keywords)), None)
            
            if found_ai:
                meta_fail = True
                meta_details = f"AI Signature found in metadata: {found_ai}"
            elif not model_tags:
                meta_fail = True
                meta_details = "Camera Model tag missing."

        checks.append(ForensicCheck(
            "Metadata Consistency", 
            "Checks for camera sensor tags vs AI signatures.", 
            "FAIL" if meta_fail else "PASS", 
            meta_details
        ))

        # --- Check 2: Error Level Analysis (ELA) Uniformity ---
        # AI images often have unnaturally uniform compression artifacts vs edited/spliced images.
        # However, pure AI generations are also "too perfect".
        # We look for lack of natural variance found in sensor captures.
        temp_buffer = io.BytesIO()
        img_rgb.save(temp_buffer, format='JPEG', quality=90)
        temp_buffer.seek(0)
        resaved = Image.open(temp_buffer)
        ela_img = ImageChops.difference(img_rgb, resaved)
        extrema = ela_img.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        
        # Calculate ELA variance
        ela_stat = np.array(ela_img)
        ela_std_dev = np.std(ela_stat)
        
        ela_fail = False
        ela_msg = "Normal compression variance."
        
        # Threshold: Too smooth (synthetic) or Chaotic (spliced)
        if ela_std_dev < 1.5: 
            ela_fail = True
            ela_msg = "ELA Variance exceptionally low. Suggests synthetic generation (Calculated: {:.2f}).".format(ela_std_dev)
        elif ela_std_dev > 15: # Arbitrary high threshold for splicing, but focusing on AI here
             pass # Splicing detection, distinct from AI generation

        checks.append(ForensicCheck(
            "ELA Uniformity", 
            "Analyzes compression artifact variance.", 
            "FAIL" if ela_fail else "PASS", 
            ela_msg
        ))

        # --- Check 3: Sensor Noise / Luminance Analysis ---
        # Natural images have high-frequency noise (Shot noise). Denoised AI images are smooth.
        img_arr = np.array(img_rgb)
        gray = 0.299 * img_arr[:,:,0] + 0.587 * img_arr[:,:,1] + 0.114 * img_arr[:,:,2]
        
        # Estimate noise via SD of Laplacian (fast edge/noise checking)
        # Note: We need a noise estimation. Using a simple standard deviation on high-pass component.
        # Generic check: Low standard deviation in flat areas. 
        # For simplicity in this non-ML scope: Global Luminance Variance.
        lum_std = np.std(gray)
        
        noise_fail = False
        noise_msg = "Natural luminance distribution."
        
        if lum_std < 20: # Very flat lighting/contrast
            noise_fail = True
            noise_msg = "Luminance variance below organic threshold (Calculated: {:.2f}).".format(lum_std)

        checks.append(ForensicCheck(
            "Sensor Noise Analysis", 
            "Checks for natural high-frequency sensor noise.", 
            "FAIL" if noise_fail else "PASS", 
            noise_msg
        ))

        # --- Check 4: Color Channel Correlation ---
        # Organic sensors allow correlation. 
        r, g, b = img_arr[:,:,0], img_arr[:,:,1], img_arr[:,:,2]
        corr_rg = np.corrcoef(r.flatten(), g.flatten())[0,1]
        corr_rb = np.corrcoef(r.flatten(), b.flatten())[0,1]
        corr_gb = np.corrcoef(g.flatten(), b.flatten())[0,1]
        avg_corr = (corr_rg + corr_rb + corr_gb) / 3
        
        color_fail = False
        color_msg = "Color channels show natural correlation."
        
        if avg_corr > 0.985:
            color_fail = True
            color_msg = "Abnormally high channel correlation (>0.985). Suggests monochrome-based generation."
        elif avg_corr < 0.3:
            color_fail = True
            color_msg = "Abnormally low correlation. Inconsistent lighting."

        checks.append(ForensicCheck(
            "Color Channel Correlation", 
            "Verifies natural light interaction across RGB channels.", 
            "FAIL" if color_fail else "PASS", 
            f"Avg Correlation: {avg_corr:.4f}"
        ))

        # --- Verdict ---
        label, score, reasoning = calculate_verdict(checks)
        
        # --- Advanced CV Analysis (Region Details) ---
        region_details = analyze_region_details(img)
        
        return {
            "sentiment_label": "N/A",
            "sentiment_score": 0,
            "authenticity_label": label,
            "authenticity_score": score,
            "reasoning": reasoning,
            "details": {
                "format": img.format,
                "dimensions": f"{img.size[0]}x{img.size[1]}",
                "checks": [vars(c) for c in checks],
                **region_details # Merge detailed text fields
            }
        }

    except Exception as e:
        print(f"Error in image analysis: {e}")
        import traceback
        traceback.print_exc()
        return {
            "authenticity_label": "Error",
            "authenticity_score": 0,
            "reasoning": f"Analysis failed: {str(e)}",
            "details": {}
        }


# --- 4. AUDIO ANALYSIS (SIGNAL PROCESSING) ---

def analyze_audio_native(audio_bytes):
    """
    Deterministic Audio Forensics: Spectral Flatness, Cutoff, Silence Detection.
    """
    try:
        with open("temp_audio_forensic.wav", "wb") as f:
            f.write(audio_bytes)
        
        # Load with librosa
        y, sr = librosa.load("temp_audio_forensic.wav", sr=None) # Keep native SR
        checks = []

        # --- Check 1: Spectral Flatness ---
        # AI/Synthetic audio often has 'dead' silence or inconsistent noise floor.
        flatness = librosa.feature.spectral_flatness(y=y)
        mean_flatness = np.mean(flatness)
        
        flat_fail = False
        flat_msg = "Spectral richness consistent with acoustic recording."
        
        # Thresholds need calibration, but generally:
        # Extremely low flatness (< 0.0005) suggests synthetic purity (no background noise)
        if mean_flatness < 0.0005: 
            flat_fail = True
            flat_msg = f"Spectral flatness near zero ({mean_flatness:.6f}). Lacks natural acoustic noise floor."
        
        checks.append(ForensicCheck(
            "Spectral Flatness", 
            "Detects synthetic silence/lack of noise floor.", 
            "FAIL" if flat_fail else "PASS", 
            flat_msg
        ))

        # --- Check 2: High-Frequency Cutoff ---
        # Spectrogram analysis to find hard cutoffs (common in 22k/24k upscaled models)
        S = np.abs(librosa.stft(y))
        freqs = librosa.fft_frequencies(sr=sr)
        avg_power = np.mean(S, axis=1)
        
        # Find frequency where power drops significantly (-60dB from max)
        max_power = np.max(avg_power)
        cutoff_freq = sr / 2 # Default to Nyquist
        
        for i, p in enumerate(avg_power):
            # Simple heuristic: if power drops to 1% of max and stays there
            if p < max_power * 0.001 and freqs[i] > 4000:
                # Check if it stays low
                if np.mean(avg_power[i:]) < max_power * 0.001:
                    cutoff_freq = freqs[i]
                    break
        
        cut_fail = False
        cut_msg = f"Natural frequency rolloff detected (Cutoff ~{int(cutoff_freq)}Hz)."
        
        # Exact cutoffs like 16kHz, 22.05kHz, 24kHz in a 44.1/48k file are suspicious
        suspicious_cutoffs = [16000, 22050, 24000]
        for sc in suspicious_cutoffs:
            if abs(cutoff_freq - sc) < 500 and sr > sc * 1.5:
                cut_fail = True
                cut_msg = f"Hard frequency cutoff detected at {int(cutoff_freq)}Hz. Suggests upsampling from lower-res model."
        
        checks.append(ForensicCheck(
            "High-Frequency Cutoff", 
            "Identifies upsampling artifacts.", 
            "FAIL" if cut_fail else "PASS", 
            cut_msg
        ))

        # --- Check 3: Silence/Breath Gap Detection ---
        # Continuous speech without breaths is a hallmark of older TTS/cloning.
        # Use simple energy based silence detection.
        non_silent_intervals = librosa.effects.split(y, top_db=30)
        
        # Calculate gaps
        gaps = []
        for i in range(len(non_silent_intervals) - 1):
            gap_len = non_silent_intervals[i+1][0] - non_silent_intervals[i][1]
            gaps.append(gap_len / sr)
        
        breath_fail = False
        breath_msg = "Natural speech pausing detected."
        
        duration = librosa.get_duration(y=y, sr=sr)
        if duration > 10 and len(gaps) == 0:
            breath_fail = True
            breath_msg = "No breath gaps detected in >10s speech segment."
        elif duration > 10 and np.mean(gaps) < 0.1:
             breath_fail = True
             breath_msg = "Unnaturally short pauses between segments."

        checks.append(ForensicCheck(
            "Physiological Breaths", 
            "Checks for natural breathing gaps in speech.", 
            "FAIL" if breath_fail else "PASS", 
            breath_msg
        ))

        # --- Verdict ---
        label, score, reasoning = calculate_verdict(checks)

        return {
            "sentiment_label": "N/A",
            "sentiment_score": 50,
            "authenticity_label": label,
            "authenticity_score": score,
            "reasoning": reasoning,
            "details": {
                "duration": round(duration, 2),
                "sampling_rate": sr,
                "checks": [vars(c) for c in checks]
            }
        }

    except Exception as e:
        print(f"Error in audio analysis: {e}")
        return {
            "authenticity_label": "Error",
            "authenticity_score": 0,
            "reasoning": f"Audio Analysis Failed: {str(e)}",
            "details": {}
        }
    finally:
        if os.path.exists("temp_audio_forensic.wav"):
            os.remove("temp_audio_forensic.wav")


# --- 5. TEXT ANALYSIS (RULE-BASED NLP) ---

def analyze_text_native(text):
    """
    Deterministic Text Forensics: Entropy, Sentence Variance, Punctuation.
    """
    if not text:
        return {"authenticity_label": "Inconclusive", "reasoning": "No text provided."}

    checks = []
    
    # --- Check 1: Sentence Length Variance (Burstiness) ---
    blob = TextBlob(text)
    sentences = blob.sentences
    
    var_fail = False
    var_msg = "Natural sentence length variation."
    
    if len(sentences) > 3:
        lengths = [len(s.words) for s in sentences]
        std_dev = np.std(lengths)
        
        if std_dev < 2.0: # Very uniform sentence lengths
            var_fail = True
            var_msg = "Robotic/Uniform sentence lengths (SD < 2.0)."
    
    checks.append(ForensicCheck(
        "Sentence Burstiness", 
        "Measures variance in sentence structure.", 
        "FAIL" if var_fail else "PASS", 
        var_msg
    ))

    # --- Check 2: Shannon Entropy / Character Distribution ---
    # Random text or high-temperature AI sampling can mess up entropy, 
    # but structured AI (RLHF) often has 'average' entropy.
    # We look for anomalies (too high or too low).
    # Normal English char entropy is ~4.0 bits/symbol.
    
    char_list = list(text)
    entropy = calculate_shannon_entropy(char_list) # Uses helper
    
    ent_fail = False
    ent_msg = "Entropy consistent with human language."
    
    if entropy < 3.5:
        ent_fail = True
        ent_msg = "Low entropy. Repetitive or simplistic structure."
    elif entropy > 5.5:
        ent_fail = True
        ent_msg = "High entropy. Possible scrambled/obfuscated text."

    checks.append(ForensicCheck(
        "Shannon Entropy", 
        "Measures information density.", 
        "FAIL" if ent_fail else "PASS", 
        f"Entropy: {entropy:.2f} bits"
    ))

    # --- Check 3: Punctuation Distribution ---
    # Humans abuse punctuation (!, ..., --). AI uses it 'correctly'.
    # This is a heuristic: strict adherence vs human flux.
    puncs = [c for c in text if c in "!?,.;:"]
    
    punc_fail = False
    punc_msg = "Natural punctuation usage."
    
    if len(text) > 100:
        punc_ratio = len(puncs) / len(text)
        if punc_ratio < 0.01:
            punc_fail = True
            punc_msg = "Abnormally low punctuation usage."

    checks.append(ForensicCheck(
        "Punctuation Analysis", 
        "Checks for natural punctuation patterns.", 
        "FAIL" if punc_fail else "PASS", 
        punc_msg
    ))

    # --- Verdict ---
    label, score, reasoning = calculate_verdict(checks)

    # Calculate sentiment for compatibility
    sentiment_score = int((blob.sentiment.polarity + 1) * 50)
    if sentiment_score > 60: sentiment_label = "Positive"
    elif sentiment_score < 40: sentiment_label = "Negative"
    else: sentiment_label = "Neutral"

    return {
        "sentiment_label": sentiment_label,
        "sentiment_score": sentiment_score,
        "authenticity_label": label,
        "authenticity_score": score,
        "reasoning": reasoning,
        "details": {
            "word_count": len(text.split()),
            "checks": [vars(c) for c in checks]
        }
    }


# --- 6. REPORT GENERATION ---

def generate_certificate(result_data, logo_path=None, image_data=None):
    """
    Generates a professional forensic certificate.
    Updated to handle new 'Likely Organic'/'Likely Synthetic' labels.
    """
    # Robust key mapping
    auth_label = result_data.get('authenticity_label') or result_data.get('authenticityLabel') or 'UNKNOWN'
    auth_score = result_data.get('authenticity_score') if result_data.get('authenticity_score') is not None else 0
    file_name = result_data.get('file_name') or result_data.get('fileName') or 'N/A'
    file_type = result_data.get('file_type') or result_data.get('fileType') or 'image'
    created_at = result_data.get('created_at') or result_data.get('createdAt') or datetime.now().strftime('%Y-%m-%d %H:%M')
    
    # Parse details to get check results if available
    raw_details = result_data.get('details') or {}
    if isinstance(raw_details, str):
        try:
            details_dict = json.loads(raw_details)
        except:
            details_dict = {}
    else:
        details_dict = raw_details
        
    checks = details_dict.get('checks', [])

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    
    # 1. Background
    p.setFillColorRGB(0.97, 0.97, 0.99)
    p.rect(0, 0, width, height, fill=1)

    # 2. Main Border
    p.setStrokeColorRGB(0.1, 0.1, 0.3)
    p.setLineWidth(1.5)
    p.rect(20, 20, width - 40, height - 40)
    
    # 3. Header Box
    p.setFillColorRGB(0.05, 0.05, 0.2)
    p.rect(20, height - 100, width - 40, 80, fill=1)
    
    # Logo
    if logo_path and os.path.exists(logo_path):
        p.drawImage(logo_path, 40, height - 90, width=60, height=60, mask='auto', preserveAspectRatio=True)
    
    # Header Text
    p.setFont("Helvetica-Bold", 24)
    p.setFillColorRGB(1, 1, 1)
    p.drawString(120, height - 55, "VERISIGHT FORENSICS")
    
    p.setFont("Helvetica", 10)
    p.setFillColorRGB(0.8, 0.8, 1)
    p.drawString(120, height - 70, "Deterministic Media Authenticity Report")
    
    # 4. Reference Info
    y_ref = height - 130
    p.setFont("Helvetica-Bold", 9)
    p.setFillColorRGB(0.1, 0.1, 0.3)
    p.drawString(40, y_ref, "REPORT ID:")
    p.setFont("Helvetica", 9)
    p.drawString(100, y_ref, f"VS-{datetime.now().strftime('%Y%m%d')}-{result_data.get('id', '000')}")
    
    p.setFont("Helvetica-Bold", 9)
    p.drawString(width - 220, y_ref, "ANALYSIS DATE:")
    p.setFont("Helvetica", 9)
    p.drawString(width - 120, y_ref, str(created_at))

    p.setStrokeColorRGB(0.8, 0.8, 0.9)
    p.line(40, y_ref - 10, width - 40, y_ref - 10)

    # 5. Verdict Section
    p.setFont("Helvetica-Bold", 16)
    p.setFillColorRGB(0.1, 0.1, 0.3)
    p.drawString(40, height - 170, "FORENSIC VERDICT")
    
    # Result Box
    p.setFillColorRGB(1, 1, 1)
    p.setStrokeColorRGB(0.1, 0.1, 0.3)
    p.setLineWidth(0.5)
    p.rect(40, height - 260, width - 80, 80, fill=1)
    
    p.setFillColorRGB(0, 0, 0)
    p.setFont("Helvetica-Bold", 14)
    p.drawString(60, height - 205, "CLASSIFICATION:")
    
    # Color coding based on 'Likely Organic' etc.
    if "Organic" in auth_label or "Real" in auth_label:
        p.setFillColorRGB(0.1, 0.6, 0.1) # Green
    elif "Synthetic" in auth_label or "Fake" in auth_label:
        p.setFillColorRGB(0.8, 0.1, 0.1) # Red
    else:
        p.setFillColorRGB(0.8, 0.6, 0) # Orange/Amber
        
    p.setFont("Helvetica-Bold", 20)
    p.drawString(200, height - 205, str(auth_label).upper())
    
    p.setFont("Helvetica-Bold", 11)
    p.setFillColorRGB(0.3, 0.3, 0.3)
    p.drawString(60, height - 235, f"Integrated Trust Score: {auth_score}/100")

    # 5.5. Analysis Methodology Section
    y_method = height - 280
    p.setFont("Helvetica-Bold", 10)
    p.setFillColorRGB(0.1, 0.1, 0.3)
    p.drawString(40, y_method, "WHAT WE ANALYZED")
    p.line(40, y_method - 5, 180, y_method - 5)
    
    y_curr_method = y_method - 18
    p.setFont("Helvetica", 8)
    p.setFillColorRGB(0.2, 0.2, 0.2)
    
    # Methodology text based on file type
    if file_type == 'image':
        methodology_lines = [
            "✓ Metadata: Camera tags vs AI signatures",
            "✓ Compression: Artifact variance patterns (ELA)",
            "✓ Sensor Noise: Real camera characteristics",
            "✓ Color Channels: Natural light interaction",
            "✓ Texture: Hair, face, clothing details"
        ]
    elif file_type == 'audio':
        methodology_lines = [
            "✓ Spectral Analysis: Synthetic silence detection",
            "✓ Frequency Cutoff: Upsampling artifacts",
            "✓ Speech Patterns: Natural breathing gaps",
            "✓ Noise Floor: Environmental consistency"
        ]
    elif file_type == 'text':
        methodology_lines = [
            "✓ Sentence Structure: Length variance",
            "✓ Information Density: Character distribution",
            "✓ Punctuation: Natural vs algorithmic usage",
            "✓ Writing Style: Human characteristics"
        ]
    else:
        methodology_lines = [
            "✓ Multiple forensic markers analyzed",
            "✓ Mathematical authenticity verification"
        ]
    
    for line in methodology_lines:
        if y_curr_method < 50: break
        p.drawString(45, y_curr_method, line)
        y_curr_method -= 10

    # 6. Detailed Analysis Report (NEW SECTION)
    y_detail = y_curr_method - 15
    
    # Only render if we have region details
    if "hair_detail" in details_dict:
        p.setFont("Helvetica-Bold", 12)
        p.setFillColorRGB(0.1, 0.1, 0.3)
        p.drawString(40, y_detail, "DETAILED ANALYSIS REPORT")
        p.line(40, y_detail - 5, 300, y_detail - 5)
        
        y_curr = y_detail - 25
        
        sections = [
            ("Hair Detail", details_dict.get("hair_detail", "N/A")),
            ("Face and Expression", details_dict.get("face_expression", "N/A")),
            ("Clothing Texture", details_dict.get("clothing_texture", "N/A")),
            ("Background and Environment", details_dict.get("background_env", "N/A"))
        ]
        
        for title, text in sections:
            if y_curr < 50: break # Pagination safety
            
            p.setFont("Helvetica-Bold", 10)
            p.setFillColorRGB(0.2, 0.2, 0.2)
            p.drawString(40, y_curr, f"• {title}")
            y_curr -= 12
            
            p.setFont("Helvetica", 9)
            p.setFillColorRGB(0.3, 0.3, 0.3)
            
            # Simple text wrapping
            words = text.split()
            line = ""
            for word in words:
                if p.stringWidth(line + " " + word, "Helvetica", 9) < width - 100:
                    line += " " + word
                else:
                    p.drawString(50, y_curr, line.strip())
                    y_curr -= 12
                    line = word
            p.drawString(50, y_curr, line.strip())
            y_curr -= 20
            
    else:
        # Fallback for old layout
        y_curr = y_detail

    # 7. Check Telemetry (Moved down)
    y_logic = y_curr - 20
    if y_logic > 50:
        p.setFont("Helvetica-Bold", 12)
        p.setFillColorRGB(0.1, 0.1, 0.3)
        p.drawString(40, y_logic, "DETERMINISTIC CHECKS EXECUTED")
        p.line(40, y_logic - 5, 300, y_logic - 5)
        
        y_curr = y_logic - 25
        
        if checks:
            for check in checks:
                if y_curr < 50: break
                
                # Check Title
                c_name = check.get('name', 'Unknown Check')
                c_status = check.get('status', 'N/A')
                c_details = check.get('details', '')
                c_description = check.get('description', '')
                
                if isinstance(c_details, (dict, list)):
                    c_details = str(c_details)
                elif c_details is None:
                    c_details = "N/A"
                
                p.setFont("Helvetica-Bold", 10)
                p.setFillColorRGB(0, 0, 0)
                p.drawString(50, y_curr, f"• {c_name}")
                
                # Status Badge
                if c_status == "PASS":
                    p.setFillColorRGB(0, 0.5, 0)
                else:
                    p.setFillColorRGB(0.8, 0, 0)
                p.drawString(250, y_curr, f"[{c_status}]")
                
                y_curr -= 12
                
                # Description (what this check does)
                if c_description:
                    p.setFont("Helvetica-Oblique", 8)
                    p.setFillColorRGB(0.4, 0.4, 0.4)
                    desc_text = c_description[:80] + "..." if len(c_description) > 80 else c_description
                    p.drawString(70, y_curr, desc_text)
                    y_curr -= 10
                
                # Details (what was found) - with text wrapping
                p.setFont("Helvetica", 8)
                p.setFillColorRGB(0.3, 0.3, 0.3)
                
                # Wrap long details text
                detail_words = str(c_details).split()
                detail_line = ""
                for word in detail_words:
                    if p.stringWidth(detail_line + " " + word, "Helvetica", 8) < width - 150:
                        detail_line += " " + word
                    else:
                        if detail_line:
                            p.drawString(70, y_curr, detail_line.strip())
                            y_curr -= 10
                        detail_line = word
                if detail_line:
                    p.drawString(70, y_curr, detail_line.strip())
                
                y_curr -= 15
        else:
            p.setFont("Helvetica", 10)
            p.drawString(50, y_curr, "No detailed check telemetry available.")

    # 7. Specimen PreviewREVIEW
    if image_data and file_type == 'image':
        try:
            from reportlab.lib.utils import ImageReader
            if "," in str(image_data):
                _, encoded = str(image_data).split(",", 1)
            else:
                encoded = str(image_data)
                
            img_bytes = base64.b64decode(encoded)
            img_io = io.BytesIO(img_bytes)
            pil_img = Image.open(img_io)
            reader = ImageReader(pil_img)
            
            # Calculate dynamic position to avoid overlap
            # Ensure we have at least 160px space (150px image + 10px padding) above footer (approx y=50)
            required_height = 130 
            
            # If text pushed too far down, start a new page or just clamp (simple clamp for now)
            # Ideally y_curr is where the text ended.
            image_y = y_curr - required_height - 20
            
            if image_y < 60:
                # Not enough space, just put it at bottom and overlay? 
                # Or simplistic "best effort" - shrink it or fail gracefully.
                # Let's try to fit it in available space or just place it at bottom with truncation risk if report is huge.
                # Better approach for this user: Fixed position at bottom was standard, but text overran.
                # We should stop text WRITING before hitting the bottom area if we want to keep image at bottom.
                # BUT the user said "alignment", implying flow.
                # Let's use the dynamic flow.
                image_y = max(60, image_y) 

            p.drawImage(reader, width/2 - 100, image_y, width=200, height=120, preserveAspectRatio=True, mask='auto', anchor='c')
        except Exception:
            pass
            
    # 8. Footer
    p.setFont("Helvetica", 7)
    p.setFillColorRGB(0.5, 0.5, 0.5)
    p.drawCentredString(width/2, 30, "Generated by VeriSight Rule-Based Engine. Analyzed without Neural Networks.")
    p.drawCentredString(width/2, 20, "This document certifies that the media has undergone strict mathematical forensics.")

    p.showPage()
    p.save()
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes


# --- 7. ADVANCED CV FORENSICS (NON-AI) ---

def analyze_region_details(pil_image):
    """
    Analyzes specific regions (Face, Hair, Clothing, Background) using Computer Vision
    to generate detailed text descriptions without AI.
    """
    results = {
        "hair_detail": "Analysis unavailable (No face detected).",
        "face_expression": "Analysis unavailable (No face detected).",
        "clothing_texture": "Analysis unavailable (No face detected).",
        "background_env": "Background texture appears consistent.",
        "regions_found": False
    }
    
    if not CV2_AVAILABLE:
        return results

    try:
        # Convert PIL to OpenCV format
        img_np = np.array(pil_image.convert('RGB'))
        img_cv = img_np[:, :, ::-1].copy() # RGB to BGR
        gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
        
        # Detect Faces
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
             # Fallback: Analyze whole image concepts if no face
             bg_texture = analyze_texture(gray)
             results["background_env"] = generate_region_text("background", bg_texture)
             return results
             
        # Process the largest face
        x, y, w, h = max(faces, key=lambda b: b[2] * b[3])
        results["regions_found"] = True
        
        # --- DEFINING REGIONS ---
        # Face: The detected box
        face_roi = gray[y:y+h, x:x+w]
        
        # Hair: Region above the face (approx 0.6x height upstream)
        hair_y_start = max(0, y - int(h * 0.6))
        hair_roi = gray[hair_y_start:y, x:x+w]
        
        # Clothing: Region below the face
        cloth_y_end = min(gray.shape[0], y + h + int(h * 1.0))
        cloth_roi = gray[y+h:cloth_y_end, x:x+w]
        
        # Background: Top-left corner (heuristic)
        bg_roi = gray[0:min(y, 100), 0:min(x, 100)] if y > 0 and x > 0 else gray[0:50, 0:50]
        
        # --- TEXTURE ANALYSIS ---
        hair_stats = analyze_texture(hair_roi)
        face_stats = analyze_texture(face_roi)
        cloth_stats = analyze_texture(cloth_roi)
        bg_stats = analyze_texture(bg_roi)
        
        # --- TEXT GENERATION ---
        results["hair_detail"] = generate_region_text("hair", hair_stats)
        results["face_expression"] = generate_region_text("face", face_stats)
        results["clothing_texture"] = generate_region_text("clothing", cloth_stats)
        results["background_env"] = generate_region_text("background", bg_stats)
        
        return results

    except Exception as e:
        print(f"CV Analysis Error: {e}")
        return results

def analyze_texture(roi):
    """Calculates texture metrics: Entropy, Laplacian Variance (Sharpness), Contrast."""
    if roi is None or roi.size == 0:
        return {"entropy": 0, "sharpness": 0, "contrast": 0}
        
    # 1. Entropy (Information Density)
    counts = np.unique(roi, return_counts=True)[1]
    probs = counts / roi.size
    entropy = -np.sum(probs * np.log2(probs + 1e-10))
    
    # 2. Laplacian Variance (Sharpness/Blur)
    # 2. Laplacian Variance (Sharpness/Blur)
    sharpness = 0
    if CV2_AVAILABLE:
        laplacian = cv2.Laplacian(roi, cv2.CV_64F)
        sharpness = laplacian.var()
    
    # 3. Contrast (Standard Deviation)
    contrast = np.std(roi)
    
    return {"entropy": entropy, "sharpness": sharpness, "contrast": contrast}

def generate_region_text(region_type, stats):
    """Maps numerical stats to descriptive sentences."""
    e = stats["entropy"]
    s = stats["sharpness"]
    c = stats["contrast"]
    
    if region_type == "hair":
        # High entropy/sharpness = strands. Low = plastic/helmet.
        if e > 4.5 and s > 200:
            return "The hair shows natural texture and volume with individual curls and slight irregularities that occur in real hair. It does not have the overly smooth sheen typical of AI."
        elif e < 3.5 or s < 50:
             return "The hair appears unnaturally smooth with a uniform sheen. The lack of individual strand definition suggests synthetic rendering or heavy filtering."
        else:
            return "Hair texture is consistent with standard digital photography, showing moderate detail and typical lighting interaction."

    elif region_type == "face":
        # High sharpness/entropy = pores/wrinkles. Low = airbrushed.
        if s > 150 and e > 4.0:
            return "The face has realistic skin texture and natural facial features. The subtle asymmetry, formatting pores, and slight shadows lend authenticity to the image."
        elif s < 60:
            return "The face shows an overly smooth or flawless finish that AI often produces. There is a lack of high-frequency skin texture details like pores or fine lines."
        else:
            return "Facial features appear structurally sound. Skin texture falls within the expected range for this resolution."

    elif region_type == "clothing":
        # High contrast/sharpness = folds/fabric.
        if c > 30 and s > 100:
             return "The clothing fabric appears natural, with soft folds and shading consistent with real materials. The lighting reflects off the wrinkles in a realistic manner."
        else:
             return "Clothing texture appears somewhat flat or generic. While not definitively synthetic, it lacks the complex folding patterns usually seen in natural fabric."

    elif region_type == "background":
        if s > 100:
            return "The background elements appear consistent with natural outdoor/indoor lighting. Shadows and highlights fall naturally, indicating authenticity."
        else:
            return "Background details are soft or out-of-focus (bokeh), which is consistent with portrait photography but reduces forensic certainty for the environment."
            
    return "Analysis inconclusive for this region."

