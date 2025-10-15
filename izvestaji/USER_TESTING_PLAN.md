# 👥 User Acceptance Testing (UAT) Plan

**Testing sa pravim korisnicima - deca i roditelji**

---

## 🎯 Testing Goals

### Primary Goals
- ✅ Aplikacija radi kako se očekuje
- ✅ Korisnici razumeju sve feature
- ✅ Nema kritičnih bugova
- ✅ UX je intuitivan za decu
- ✅ Roditelji su zadovoljni

### Success Metrics
- **Completion Rate:** >80% korisnika završi core tasks
- **Time on Task:** <3 min za dodavanje domaćeg
- **Error Rate:** <5% user errors
- **Satisfaction:** 4+/5 average rating
- **Recommendation:** >70% NPS score

---

## 👥 Test Participants

### Target Groups

**Grupa 1: Učenici (Primarna grupa)**
- **Broj:** 20 učenika
- **Uzrast:** 7-14 godina (1-8 razred)
- **Mix:** 50% dečaci, 50% devojčice
- **Lokacija:** 2-3 različite škole
- **Tech Savvy:** Mix (početnici i napredni)

**Grupa 2: Roditelji**
- **Broj:** 15 roditelja
- **Uzrast:** 30-50 godina
- **Mix:** Različit tech background
- **Uređaji:** Mobile (70%), Desktop (30%)

**Grupa 3: Nastavnici (Optional)**
- **Broj:** 5 nastavnika
- **Cilj:** Feedback za škole

---

## 📋 Test Scenarios

### 🎓 Za Učenike

#### Scenario 1: Registracija i Setup
**Zadatak:** Kreiraj nalog i postavi profil

**Koraci:**
1. Otvori aplikaciju
2. Klikni "Registruj se"
3. Unesi email i lozinku
4. Unesi ime, školu, razred
5. Završi registraciju

**Success:** Korisnik se registrovao <5 min

**Metrics:**
- Time to complete
- Errors encountered
- Help needed?

---

#### Scenario 2: Dodaj Domaći Zadatak
**Zadatak:** Dodaj novi domaći zadatak

**Koraci:**
1. Idi na Dashboard
2. Klikni "Domaći zadaci"
3. Klikni "+ Dodaj zadatak"
4. Unesi predmet, naslov, rok
5. Sačuvaj

**Success:** Zadatak je dodat <3 min

---

#### Scenario 3: Fotografiši Dokaz
**Zadatak:** Uslikaj urađeni domaći

**Koraci:**
1. Otvori zadatak
2. Klikni "Uslikaj dokaz"
3. Dozvoli pristup kameri
4. Fotografiši papir sa zadatkom
5. Potvrdi sliku

**Success:** Slika je snimljena i sačuvana

**Test Points:**
- Da li kamera radi?
- Da li AI enhancement radi?
- Da li je kompresija dobra?
- Da li radi offline?

---

#### Scenario 4: Unesi Raspored
**Zadatak:** Dodaj nedeljni raspored časova

**Koraci:**
1. Idi na "Raspored"
2. Izaberi dan
3. Dodaj čas
4. Unesi predmet, vreme, učionicu
5. Sačuvaj

**Success:** Raspored je unet

---

#### Scenario 5: Gamifikacija
**Zadatak:** Označi zadatak kao urađen i vidi XP

**Koraci:**
1. Otvori zadatak
2. Klikni "Označi urađeno"
3. Vidi XP nagradu
4. Proveri level progress

**Success:** Korisnik razume gamifikaciju

---

### 👨‍👩‍👧 Za Roditelje

#### Scenario 6: Povezi sa Detetom
**Zadatak:** Povezivanje sa nalogom deteta

**Koraci:**
1. Registruj se kao roditelj
2. Idi na "Porodica"
3. Skeniraj QR kod deteta
4. Potvrdi povezivanje

**Success:** Povezivanje uspešno <2 min

---

#### Scenario 7: Vidi Napredak Deteta
**Zadatak:** Pregledaj šta je dete uradilo

**Koraci:**
1. Otvori Dashboard
2. Vidi listu domaćih
3. Otvori dokaz (sliku)
4. Pregledaj raspored

**Success:** Roditelj vidi sve info

---

#### Scenario 8: Nedeljni Izveštaj
**Zadatak:** Export PDF izveštaja

**Koraci:**
1. Idi na "Ocene"
2. Klikni "Export PDF"
3. Preuzmi fajl
4. Otvori PDF

**Success:** PDF se generiše i preuzme

---

## 📱 Device Testing

### Mobile (Priority 1)

**Devices:**
- iPhone 12+ (iOS 15+)
- Samsung Galaxy S21+ (Android 12+)
- Budget Android (Android 10+)

**Browsers:**
- Chrome Mobile
- Safari iOS
- Samsung Internet

**Tests:**
- Touch interactions
- Camera functionality
- PWA installation
- Offline mode
- Performance

---

### Desktop (Priority 2)

**Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Screen Sizes:**
- 1920×1080
- 1366×768
- 2560×1440

---

### Tablet (Priority 3)

**Devices:**
- iPad Air
- Samsung Galaxy Tab

**Orientation:**
- Portrait
- Landscape

---

## 🐛 Bug Reporting

### Bug Report Template

```markdown
**Title:** [Kratko, opisno]

**Severity:**
- [ ] Critical (app unusable)
- [ ] High (major feature broken)
- [ ] Medium (minor issue)
- [ ] Low (cosmetic)

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected:** [Šta bi trebalo da se desi]
**Actual:** [Šta se stvarno desilo]

**Environment:**
- Device: [iPhone 13, Samsung S21, etc.]
- OS: [iOS 16, Android 12, etc.]
- Browser: [Chrome, Safari, etc.]
- Version: [App version]

**Screenshot/Video:** [Attach]

**Additional Notes:** [Anything else]
```

---

## 📊 Feedback Collection

### Survey Questions (5-point scale)

**Usability:**
1. Aplikacija je laka za korišćenje (1-5)
2. Dizajn je privlačan (1-5)
3. Našao sam sve što mi treba (1-5)

**Features:**
4. Kamera radi dobro (1-5)
5. Gamifikacija je motivišuća (1-5)
6. Notifikacije su korisne (1-5)

**Performance:**
7. Aplikacija je brza (1-5)
8. Offline mode radi (1-5)

**Overall:**
9. Preporučio bih drugima (1-5)
10. Šta bi trebalo dodati/poboljšati? (Open)

---

## 🎓 Testing Sessions

### Session Format

**Duration:** 60 minutes per participant

**Schedule:**
- 0-5 min: Welcome & intro
- 5-10 min: Setup (install, register)
- 10-40 min: Task scenarios
- 40-55 min: Free exploration
- 55-60 min: Survey & feedback

**Facilitator Role:**
- Observe (don't help unless stuck)
- Take notes
- Record screen (with permission)
- Ask questions

---

## 📈 Analysis

### Quantitative Data

- **Task Completion Rate:** X% completed each task
- **Time on Task:** Average, median, max
- **Error Rate:** Num errors / total attempts
- **Click Paths:** Where users go
- **Drop-off Points:** Where users quit

### Qualitative Data

- **Observations:** What went well/bad
- **Quotes:** Memorable user comments
- **Pain Points:** Common struggles
- **Delights:** What users loved

---

## 🔄 Iteration Process

### Week 1: Testing
- Day 1-2: Učenici (10 korisnika)
- Day 3-4: Roditelji (8 korisnika)
- Day 5: Analiza

### Week 2: Fixes
- Fix critical bugs
- Improve UX issues
- Document changes

### Week 3: Re-test
- Test sa novih 10 korisnika
- Verify fixes work
- Collect new feedback

### Week 4: Launch Decision
- GO/NO-GO meeting
- Review all findings
- Decide on public launch

---

## ✅ Launch Readiness Checklist

### Must Have (Blocker)

- [ ] 0 critical bugs
- [ ] 0 high-priority bugs
- [ ] Task completion >80%
- [ ] Satisfaction score >4/5
- [ ] Works on all major devices
- [ ] Offline mode works
- [ ] Camera works reliably

### Nice to Have

- [ ] Dark mode polished
- [ ] All animations smooth
- [ ] Zero medium bugs
- [ ] Perfect accessibility

### Post-Launch

- [ ] Beta group (50 users)
- [ ] Monitor closely (24/7)
- [ ] Quick bug fixes
- [ ] Collect ongoing feedback

---

## 👶 Child Safety Testing

### Special Considerations

- [ ] Content filter catches inappropriate words
- [ ] PII detection works
- [ ] Parental controls work
- [ ] Age-appropriate content only
- [ ] No external tracking
- [ ] Safe image uploads

**Test Cases:**
1. Try to enter bad words → Should be blocked ✅
2. Enter email in homework → Should warn ✅
3. Upload inappropriate image → Should flag ✅

---

## 🎯 Success Criteria

### Minimum Viable (MVP Launch)

- ✅ 80%+ task completion
- ✅ 4+/5 satisfaction
- ✅ 0 critical bugs
- ✅ Works on iOS + Android
- ✅ Core features functional

### Ideal (Public Launch)

- ✅ 90%+ task completion
- ✅ 4.5+/5 satisfaction
- ✅ 0 high-priority bugs
- ✅ 50+ NPS score
- ✅ All features polished

---

## 📞 Participant Recruitment

### Where to Find Testers

- Local schools (ask teachers)
- Parent Facebook groups
- Online communities
- Friends & family
- Beta testing platforms (betalist.com)

### Incentives

- Free premium account (3 months)
- Thank you gift card (500 RSD)
- Name in credits
- Early access badge

---

## 📝 Documentation

### Record Everything

- Session videos (with permission)
- Screen recordings
- Bug reports
- Feedback notes
- Feature requests

### Create Reports

- Testing Summary Report
- Bug List (prioritized)
- UX Improvements List
- Feature Requests

---

**Testing sa pravim korisnicima je NAJBOLJI način da napravite savršenu aplikaciju! 🎯**

