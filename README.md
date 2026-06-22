# VitalVision — AI Medical Imaging Platform

> First Place — Sfida Shëndetësi Digjitale · JunctionX Tirana 2026

VitalVision is an AI-powered medical imaging platform that enables automatic anomaly detection in chest X-rays, generates structured diagnostic reports with risk scores and provides real-time cross-departmental access through an integrated PACS archive.

---

## The Problem

Hospitals lose critical diagnostic time when imaging results sit isolated — wrong format, wrong folder, wrong floor. Radiologists interpret images manually, reports don't reach the right departments, and there is no centralized system connecting the people who find problems with the people who need to act on them.

---

## What We Built

A full-stack clinical platform with three user roles — radiologist, department physician, and ops — each with a tailored view into the same underlying data.

A radiologist uploads a chest X-ray. A trained EfficientNet-B0 model analyzes it instantly and returns a structured diagnostic report: findings per anatomical region, severity ratings, an overall risk score from 0 to 100, a clinical impression, and a concrete recommendation. The study is archived to the patient's permanent PACS file with one click. If the risk score exceeds 75, relevant departments are automatically notified.

Every other physician in the hospital can search for a patient and read the full report in real time — no phone calls, no transfers, no waiting.

---

## Features

- Chest X-ray upload with image viewer
- EfficientNet-B0 binary classifier — trained on 5,216 images, **86.86% test accuracy**
- Structured diagnostic report with per-finding severity
- Risk score (0–100) with automatic HIGH/CRITICAL alerts
- PACS archive — searchable by patient name, personal number, modality, body part, risk level
- Role-based access — radiologist, department doctor, ops
- Invite-code registration system
- Cross-departmental read-only access panel
- Ops dashboard with aggregate stats and trends
- Albanian/English language toggle
- PDF report export

---

## Model

| Property | Value |
|---|---|
| Architecture | EfficientNet-B0 (pretrained ImageNet) |
| Task | Binary classification — NORMAL vs PNEUMONIA |
| Dataset | Kaggle Chest X-Ray Pneumonia (Guangzhou WCMC) |
| Training images | 5,216 |
| Test images | 624 |
| Test accuracy | **86.86%** |
| Sensitivity | 85.4% |
| Specificity | 89.3% |
| F1 (pneumonia) | 0.89 |
| Training time | ~1.5 hours on M1 Max |

Training strategy: frozen backbone for 5 epochs → full fine-tuning with cosine annealing LR, weighted random sampler for class imbalance, label smoothing, gradient clipping, early stopping.

---

## System Workflow

```
Upload → EfficientNet-B0 Analysis → Risk Score → PACS Archive → Cross-departmental Access
                                         ↓
                              Risk ≥ 75 → Auto-alert
```

---

## Stack

**AI/ML** — Python, PyTorch, EfficientNet-B0, torchvision  
**Backend** — FastAPI, Uvicorn, PyJWT, bcrypt  
**Frontend** — React, TypeScript, Vite, Tailwind CSS  
**Deployment** — Render (backend), Vercel (frontend)

---

## Data Sources

- Kaggle Chest X-Ray Pneumonia Dataset (Guangzhou Women and Children's Medical Center)
- NIH ChestXray14 (reference)
- RSNA Pneumonia Detection Dataset (reference)
- VinBigData Chest X-Ray Abnormalities Dataset (reference)

---

## Team

| Name | Role |
|---|---|
| **Virvi Huta** | AI Lead — Machine Learning, Deep Learning |
| **Atida Ashta** | Data Science |
| **Suisa Shehi** | Frontend — UI/UX Lead |
| **Ester Lelçi** | Frontend — Design & Branding |
| **Aiden Hasanaj** | Backend |

---

Built at JunctionX Tirana 2026 · Sfida Shëndetësi Digjitale · First Place
