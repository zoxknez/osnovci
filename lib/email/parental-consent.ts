// Parental Consent Email - COPPA Compliance

import { log } from "@/lib/logger";
import { createTransporter } from "./transporter";
import { sendEmailWithRetry } from "./utils";

interface ParentalConsentEmailData {
  parentEmail: string;
  parentName: string;
  childName: string;
  childAge: number;
  consentToken: string;
  consentUrl: string;
}

/**
 * Send parental consent request email
 * Required for children under 13 (COPPA compliance)
 */
export async function sendParentalConsentEmail(
  data: ParentalConsentEmailData,
): Promise<{ success: boolean; error?: string }> {
  const {
    parentEmail,
    parentName,
    childName,
    childAge,
    consentToken,
    consentUrl,
  } = data;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="sr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Saglasnost roditelja - Osnovci</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #4F46E5;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .token-box {
          background-color: #F3F4F6;
          border: 2px dashed #4F46E5;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 20px 0;
        }
        .token {
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 8px;
          color: #4F46E5;
          font-family: monospace;
        }
        .button {
          display: inline-block;
          background-color: #4F46E5;
          color: #ffffff !important;
          text-decoration: none;
          padding: 15px 40px;
          border-radius: 8px;
          font-weight: bold;
          text-align: center;
          margin: 20px 0;
        }
        .warning {
          background-color: #FEF3C7;
          border-left: 4px solid #F59E0B;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .info-box {
          background-color: #EFF6FF;
          border-left: 4px solid #3B82F6;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          font-size: 14px;
          color: #6B7280;
        }
        ul {
          padding-left: 20px;
        }
        li {
          margin-bottom: 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📚 Osnovci</div>
          <h1 style="color: #1F2937; margin: 0;">Zahtev za saglasnost roditelja</h1>
        </div>
        
        <div class="content">
          <p>Poštovani/a <strong>${parentName}</strong>,</p>
          
          <p>
            Vaše dete <strong>${childName}</strong> (${childAge} godina) želi da kreira nalog na Osnovci platformi.
          </p>
          
          <div class="warning">
            <strong>⚠️ COPPA Saglasnost</strong><br>
            Pošto je dete mlađe od 13 godina, federalni zakoni (COPPA - Children's Online Privacy Protection Act) 
            zahtevaju saglasnost roditelja pre kreiranja naloga.
          </div>
          
          <div class="info-box">
            <strong>📋 Šta Osnovci prikuplja?</strong>
            <ul>
              <li>Ime i prezime učenika</li>
              <li>Email adresa (opciono)</li>
              <li>Informacije o školi i razredu</li>
              <li>Domaći zadaci, ocene, i raspored časova</li>
              <li>Aktivnost korišćenja aplikacije</li>
            </ul>
          </div>
          
          <div class="info-box">
            <strong>🔒 Kako štitimo privatnost?</strong>
            <ul>
              <li>Svi podaci su enkriptovani</li>
              <li>Vi imate potpun uvid u sve aktivnosti deteta</li>
              <li>Neće biti deljenja podataka sa trećim stranama</li>
              <li>Možete u bilo kom trenutku zahtevati brisanje podataka</li>
            </ul>
          </div>
          
          <p><strong>Da biste dali saglasnost, koristite jedan od sledećih načina:</strong></p>
          
          <h3 style="color: #4F46E5;">Opcija 1: Unesite kod</h3>
          <div class="token-box">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #6B7280;">Vaš kod za saglasnost:</p>
            <div class="token">${consentToken}</div>
          </div>
          <p style="text-align: center;">
            Unesite ovaj kod u aplikaciji kada vas dete pita za saglasnost.
          </p>
          
          <h3 style="color: #4F46E5; margin-top: 30px;">Opcija 2: Kliknite dugme</h3>
          <div style="text-align: center;">
            <a href="${consentUrl}" class="button">
              ✅ Dajem saglasnost
            </a>
          </div>
          
          <div class="warning" style="margin-top: 30px;">
            <strong>⏰ Važna napomena:</strong><br>
            Ovaj kod je validan 24 sata. Nakon isteka, dete će morati zatražiti novu saglasnost.
          </div>
          
          <p style="margin-top: 30px;">
            Ako imate pitanja ili nedoumice, slobodno nas kontaktirajte na 
            <a href="mailto:podrska@osnovci.rs">podrska@osnovci.rs</a>.
          </p>
          
          <p>
            Ako NISTE roditelj <strong>${childName}</strong> ili ne želite da date saglasnost, 
            jednostavno ignorišite ovaj email.
          </p>
        </div>
        
        <div class="footer">
          <p>
            <strong>Osnovci</strong> - Moderna aplikacija za učenike i roditelje<br>
            Email: <a href="mailto:info@osnovci.rs">info@osnovci.rs</a>
          </p>
          <p style="font-size: 12px; color: #9CA3AF;">
            Ovaj email je poslat jer je neko pokušao da kreira nalog za dete sa ovom email adresom.<br>
            Ako to niste Vi, molimo Vas da ignorišete ovu poruku.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
Osnovci - Zahtev za saglasnost roditelja

Poštovani/a ${parentName},

Vaše dete ${childName} (${childAge} godina) želi da kreira nalog na Osnovci platformi.

⚠️ COPPA SAGLASNOST
Pošto je dete mlađe od 13 godina, federalni zakoni (COPPA) zahtevaju saglasnost roditelja pre kreiranja naloga.

Da biste dali saglasnost, unesite sledeći kod u aplikaciji:

KOD: ${consentToken}

Ili kliknite na link:
${consentUrl}

Ovaj kod je validan 24 sata.

Šta Osnovci prikuplja?
- Ime i prezime učenika
- Email adresa (opciono)
- Informacije o školi i razredu
- Domaći zadaci, ocene, i raspored časova
- Aktivnost korišćenja aplikacije

Kako štitimo privatnost?
- Svi podaci su enkriptovani
- Vi imate potpun uvid u sve aktivnosti deteta
- Neće biti deljenja podataka sa trećim stranama
- Možete u bilo kom trenutku zahtevati brisanje podataka

Pitanja? Kontaktirajte nas: podrska@osnovci.rs

Osnovci - Moderna aplikacija za učenike i roditelje
`;

  try {
    const transporter = createTransporter();
    const result = await sendEmailWithRetry(transporter, {
      to: parentEmail,
      subject: `Saglasnost roditelja za ${childName} - Osnovci`,
      html: htmlContent,
      text: textContent,
    });

    if (result.success) {
      log.info("Parental consent email sent", {
        parentEmail,
        childName,
        childAge,
      });
      return { success: true };
    } else {
      log.error("Failed to send parental consent email", {
        error: result.error,
        parentEmail,
      });
      return { success: false, error: result.error || "Failed to send email" };
    }
  } catch (error) {
    log.error("Error sending parental consent email", {
      error,
      parentEmail,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send confirmation email after consent is given
 */
export async function sendConsentConfirmationEmail(
  parentEmail: string,
  parentName: string,
  childName: string,
): Promise<{ success: boolean }> {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="sr">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .success { background-color: #D1FAE5; border-left: 4px solid #10B981; padding: 15px; }
        .footer { margin-top: 30px; font-size: 12px; color: #6B7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1 style="color: #4F46E5;">✅ Saglasnost uspešno data</h1>
        
        <p>Poštovani/a <strong>${parentName}</strong>,</p>
        
        <div class="success">
          <p style="margin: 0;">
            <strong>Uspešno ste dali saglasnost!</strong><br>
            Dete <strong>${childName}</strong> sada može koristiti Osnovci aplikaciju.
          </p>
        </div>
        
        <p>
          <strong>Šta možete kao roditelj?</strong>
        </p>
        <ul>
          <li>Prijavite se na svoj guardian nalog da bi videli aktivnost deteta</li>
          <li>Povežite se sa detetom preko "Link koda"</li>
          <li>Pratite domaće zadatke, ocene i raspored</li>
          <li>U bilo kom trenutku možete povući saglasnost</li>
        </ul>
        
        <p>
          Hvala što pomažete svom detetu u učenju! 🎓
        </p>
        
        <div class="footer">
          <p>Osnovci - podrska@osnovci.rs</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const transporter = createTransporter();
  const result = await sendEmailWithRetry(transporter, {
    to: parentEmail,
    subject: `Saglasnost potvrđena - Osnovci`,
    html: htmlContent,
    text: `Uspešno ste dali saglasnost za korišćenje Osnovci aplikacije. Dete ${childName} sada može koristiti aplikaciju.`,
  });

  return { success: result.success };
}
