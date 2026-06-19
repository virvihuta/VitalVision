# VitalVision — AI Medical Imaging Platform

Early anomaly detection, structured diagnostic reports, and real-time cross-departmental access. Built at JunctionX Tirana 2026.

---

## What it does

Doctors lose critical time when imaging results sit isolated — wrong format, wrong folder, wrong floor. This platform closes that gap.

A radiologist uploads a medical image. The system analyzes it and returns a structured diagnostic report with a risk score, per-region findings, severity ratings, and a clinical recommendation. The study gets archived to the patient's file. If the risk is high, the relevant departments are notified automatically.

Every other doctor in the hospital can search that patient and read the report instantly — no calls, no transfers, no waiting.

---

## Features

- Image uploader with basic viewer
- AI analysis with automatic Risk Score (0–100)
- Structured diagnostic report with per-finding severity
- Automatic PACS archiving
- Cross-departmental read-only access panel
- Automatic alerts for high-risk studies

---

## Workflow

```
Upload → AI Analysis → PACS Archive → Cross-departmental Access
```

---

## User roles

**Radiologist** — uploads images, reviews AI analysis, archives studies to PACS.

**Department physician** — read-only access to patient studies; receives alerts for high-risk cases relevant to their department.

**Ops / analytics team** — aggregate view of diagnostic activity, turnaround times, and risk trends across the hospital.

---

## Data sources

- NIH Chest X-Ray Dataset
- RSNA Pneumonia Detection Dataset
- VinBigData Chest X-Ray Abnormalities Dataset
- Synthetic DICOM data

---

## Team

Vertex:
Aiden Hasanaj: Backend Development
Atida Ashta: Data Science
Ester Lelçi: Frontend Development
Suisa Shehi: Frontend Development
Virvi Huta: Data Science

Built at JunctionX Tirana 2026 — Sfida Shëndetësi Digjitale.
