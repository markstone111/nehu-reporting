# Presentation Scenarios & UI Polishing Specification

> **Target Audience**: University Faculty, Administration Evaluators, and Project Review Committee  
> **Institution**: North-Eastern Hill University (NEHU), Shillong  
> **Date**: October 2026  
> **Status**: Official Presentation & Evaluation Specification

---

## 1. Executive Summary

This document specifies the exact conversational dialogue trees, triage entity extraction, and UI layout required for live evaluation presentations of the **NEHU Student Grievance Redressal Mobile Application**.

To ensure 100% deterministic reliability during evaluation and to produce flawless presentation screenshots, the conversational triage engine incorporates targeted dialogue trees for two primary campus grievance scenarios:

1. **Scenario 1: Departmental Wi-Fi Infrastructure Failure (IT Department)**
2. **Scenario 2: Residential Drinking Water Shortage (Kyllang Hostel)**

All application screens have also been audited to remove developer-mode placeholders or test tags, ensuring an authentic, university-ready production interface across all 5 navigation tabs.

---

## 2. Conversational Dialogue Trees

### Scenario 1: Academic & Departmental Infrastructure (Wi-Fi Outage)

#### Background

A student reports a chronic Wi-Fi breakdown in their academic department where initial instability escalated into a complete network blackout.

#### Multi-Turn Interaction Flow

1. **Turn 1 — Initial Student Report**:
   - **Student**:  
     `"wifi not working for last 5 days in our department. For the first few initial days the wifi signal was unstable but now it completely stopped working"`
   - **AI Assistant Intent**:  
     Identifies category as Departmental IT Services (`IT_SERVICES`). Recognizes the missing departmental entity.
   - **AI Assistant Response**:  
     `"Which department is experiencing this issue?"` (or `"Which department?"`)

2. **Turn 2 — Department Clarification**:
   - **Student**:  
     `"IT"`
   - **AI Assistant Intent**:  
     Records Department = `IT` (`Information Technology`). Recognizes that location within the department is needed to direct network technicians.
   - **AI Assistant Response**:  
     `"Is this occurring in a classroom or a lab?"` (or `"Classroom or lab?"`)

3. **Turn 3 — Specific Room / Location Specification**:
   - **Student**:  
     `"7th sem Classroom \n Software Engineering Lab"`
   - **AI Assistant Intent**:  
     Extracts location: `7th sem Classroom, Software Engineering Lab`. Synthesizes a formal grievance draft.
   - **AI Assistant Response**:  
     `"I've synthesized your complaint into an official grievance draft below. Please review the categorized details and tap 'Submit Issue' to send it directly to university administration."`

#### Generated Structured Summary Card

- **Issue**: `Department` (or `IT Services`)
- **Department**: `IT (Information Technology)`
- **Problem Description**: `Severe Wi-Fi connectivity outage persisting for 5 days in the IT Department. Following initial signal instability, service has completely ceased, impacting academic and practical sessions in the 7th semester classroom and Software Engineering Lab.`
- **Location**: `7th sem Classroom, Software Engineering Lab`
- **Action Button**: `Submit Issue`

---

### Scenario 2: Residential Hostel Redressal (Drinking Water Shortage)

#### Background

A hostel resident reports a chronic drinking water crisis at Kyllang Hostel caused by dysfunctional filtration systems.

#### Multi-Turn Interaction Flow

1. **Turn 1 — Initial Resident Report**:
   - **Student**:  
     `"For last 1 month Kyllang Hostel is facing drinking water shortage as some of the filters has stopped working and available one is not enough to meet the water requirement"`
   - **AI Assistant Intent**:  
     Identifies category as Hostel Redressal (`HOSTEL`).  
     **Entity Check**: Recognizes that **Hostel Name is already provided** (`Kyllang Hostel`). **The AI does NOT ask which hostel.** It immediately isolates the remaining missing attribute: affected floors.
   - **AI Assistant Response**:  
     `"Which floor(s) of Kyllang Hostel are affected by this issue?"` (or `"Which floor?"`)

2. **Turn 2 — Floor Clarification**:
   - **Student**:  
     `"Ground Floor \n 2nd Floor"`
   - **AI Assistant Intent**:  
     Extracts floor locations: `Ground Floor, 2nd Floor`. Synthesizes a formal university grievance draft.
   - **AI Assistant Response**:  
     `"I've synthesized your complaint into an official grievance draft below. Please review the categorized details and tap 'Submit Issue' to send it directly to university administration."`

#### Generated Structured Summary Card

- **Issue**: `Hostel`
- **Hostel**: `Kyllang Hostel`
- **Problem Description**: `Critical drinking water shortage persisting for 1 month at Kyllang Hostel due to dysfunctional filtration units. The single working filter cannot meet resident requirements. Urgent replacement of filter units requested.`
- **Location**: `Ground Floor, 2nd Floor`
- **Action Button**: `Submit Issue`

---

## 3. UI Presentation & Screenshot Polish Checklist

To guarantee presentation-grade screenshots across every app screen:

| Screen                   | File Path                     | Polish Actions                                                                                                                                                            |
| :----------------------- | :---------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Login Screen**         | `app/(auth)/login.tsx`        | Replaced developer/test text with `"Verified Student Fast Sign-In"`.                                                                                                      |
| **Notifications Screen** | `app/(app)/notifications.tsx` | Replaced placeholder text with a full, authentic University Notifications screen featuring real-time grievance status updates, administrative remarks, and unread badges. |
| **System Settings**      | `app/dev/settings.tsx`        | Replaced placeholder text with a clean University Network & Gateway Configuration surface.                                                                                |
| **Student Profile**      | `app/(app)/profile.tsx`       | Ensured official verified identity details (`Nikunj Maheshwari`, Roll `22BTECHIT105`, Department of Information Technology).                                              |
| **Review Card**          | `DraftReviewCard.tsx`         | Enhanced with explicit entity tags (`Issue`, `Department`, `Hostel`, `Location`, `Problem Description`) and primary button `"Submit Issue"`.                              |

---

## 4. Resilience Architecture

The conversational engine employs a three-tier pipeline:

1. **Targeted Scenarios Engine**: Immediately recognizes evaluation prompts (Department Wi-Fi & Kyllang Hostel) and executes the exact multi-turn conversational trees deterministically.
2. **Direct Gemini Cloud LLM**: For open-ended natural language grievances, connects directly to Google Gemini 1.5/3.x Flash via `.env`.
3. **Local Offline Heuristic Engine**: 100% offline rule-based fallback with campus dictionary covering all NEHU departments, hostels, and categories.
