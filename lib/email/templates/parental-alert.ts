
/**
 * Parental Alert Email Template
 * Used for security incidents, lockouts, and urgent notifications
 */

export interface ParentalAlertTemplate {
  subject: string;
  html: string;
  text: string;
}

export function createParentalAlertTemplate(
  alertType: string,
  metadata: Record<string, string>
): ParentalAlertTemplate {
  let subject = "";
  let html = "";
  let text = "";

  if (alertType === "consent_lockout") {
    subject = "🚨 Osnovci: Sigurnosno upozorenje - Verifikacija pristanka";
    const studentName = metadata['studentName'] || "Vaše dete";
    const attemptCount = metadata['attemptCount'] || "više";
    
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🚨 Sigurnosno upozorenje</h2>
        
        <p>Poštovani,</p>
        
        <p>
          Detektovali smo <strong>${attemptCount} neuspelih pokušaja</strong> 
          verifikacije koda pristanka za učenika <strong>${studentName}</strong>.
        </p>
        
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>Kod je privremeno blokiran iz bezbednosnih razloga.</strong>
          </p>
        </div>
        
        <p><strong>Šta treba da uradite:</strong></p>
        <ul>
          <li>Ako ste Vi pokušavali verifikaciju, sačekajte 15 minuta i pokušajte ponovo</li>
          <li>Ako niste Vi pokušavali verifikaciju, molimo kontaktirajte nas ODMAH</li>
          <li>Proverite da li neko neovlašćeno ima pristup vašem email-u</li>
        </ul>
        
        <p>
          Možete zatražiti novi kod pristanka sa strane učenika ili kontaktirati našu podršku.
        </p>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          Ovo je automatska poruka iz sigurnosnog sistema Osnovci aplikacije.
        </p>
      </div>
    `;
    
    text = `
      🚨 Sigurnosno upozorenje
      
      Poštovani,
      
      Detektovali smo ${attemptCount} neuspelih pokušaja verifikacije koda pristanka za učenika ${studentName}.
      
      Kod je privremeno blokiran iz bezbednosnih razloga.
      
      Šta treba da uradite:
      - Ako ste Vi pokušavali verifikaciju, sačekajte 15 minuta i pokušajte ponovo
      - Ako niste Vi pokušavali verifikaciju, molimo kontaktirajte nas ODMAH
      - Proverite da li neko neovlašćeno ima pristup vašem email-u
      
      Ovo je automatska poruka iz sigurnosnog sistema Osnovci aplikacije.
    `;
  } else {
    subject = "🚨 Osnovci: Sigurnosno upozorenje";
    html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ef4444;">🚨 Sigurnosno upozorenje</h2>
        <p>Detektovan je sigurnosni incident: ${alertType}</p>
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          Ovo je automatska poruka iz sigurnosnog sistema Osnovci aplikacije.
        </p>
      </div>
    `;
    text = `
      🚨 Sigurnosno upozorenje
      
      Detektovan je sigurnosni incident: ${alertType}
      
      Ovo je automatska poruka iz sigurnosnog sistema Osnovci aplikacije.
    `;
  }

  return { subject, html, text };
}
