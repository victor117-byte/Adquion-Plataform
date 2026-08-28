import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export default function Terminos() {
  return (
    <LegalLayout title="Términos de Servicio" updatedAt="28 de agosto de 2026">
      <LegalSection title="1. Aceptación de los términos">
        <p>
          Al crear una cuenta o usar Adquion aceptas estos Términos de Servicio y nuestra{" "}
          <a href="/privacidad" className="font-semibold text-brand hover:underline">
            Política de Privacidad
          </a>
          . Si no estás de acuerdo, no debes usar la plataforma.
        </p>
      </LegalSection>

      <LegalSection title="2. Qué es Adquion">
        <p>
          Adquion es una plataforma que automatiza la descarga de documentos del SAT
          (CFDI, constancias, opiniones de cumplimiento), organiza declaraciones y envía
          notificaciones por WhatsApp y correo. Actualmente el servicio es gratuito
          mientras el proyecto está en etapa de lanzamiento.
        </p>
      </LegalSection>

      <LegalSection title="3. Tu cuenta y tus credenciales">
        <ul>
          <li>Eres responsable de la veracidad de los datos que registras.</li>
          <li>
            Eres responsable de mantener la confidencialidad de tu contraseña y de toda
            actividad que ocurra dentro de tu organización, incluyendo la de los usuarios
            que invites (por ejemplo, otros contadores de tu equipo).
          </li>
          <li>
            Notifícanos de inmediato si sospechas un acceso no autorizado a tu cuenta.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Autorización para usar tus credenciales del SAT">
        <p>
          Al conectar tu RFC, nos autorizas a usar tus credenciales del SAT
          <strong> únicamente</strong> para descargar tus documentos fiscales y ejecutar
          las automatizaciones que configures. Declaras que tienes el derecho y la
          autorización legal para actuar sobre el RFC que conectas — ya sea el tuyo, el
          de tu empresa, o el de un contribuyente que te haya dado ese mandato.
        </p>
      </LegalSection>

      <LegalSection title="5. Responsabilidad sobre el uso de la plataforma y de los datos">
        <p>
          Eres el único responsable de la información que subes, generas o gestionas
          dentro de tu organización, y del uso que tú o los usuarios de tu equipo le den
          a esa información — incluyendo el cumplimiento de cualquier obligación legal
          que tengas frente a tus propios clientes o contribuyentes respecto al manejo de
          sus datos personales y fiscales. Adquion no controla ni se hace responsable de
          decisiones fiscales, contables o de negocio que tomes con base en la
          información mostrada en la plataforma; te recomendamos siempre confirmar la
          información crítica con tu contador o asesor fiscal.
        </p>
      </LegalSection>

      <LegalSection title="6. Seguridad, de nuestro lado">
        <p>
          Implementamos medidas de seguridad razonables para proteger tu información: las
          sesiones se manejan con cookies cifradas de solo servidor (no accesibles desde
          JavaScript), las contraseñas se almacenan cifradas y limitamos el acceso a la
          información según el rol de cada usuario dentro de tu organización. Ningún
          sistema es 100% infalible, pero de nuestro lado nos comprometemos a operar la
          plataforma de forma segura y a corregir con prioridad cualquier vulnerabilidad
          que identifiquemos o nos reporten.
        </p>
      </LegalSection>

      <LegalSection title="7. Disponibilidad del servicio">
        <p>
          Adquion está en una etapa temprana de lanzamiento. Podemos modificar, pausar o
          descontinuar funciones del servicio, y avisaremos con anticipación antes de
          cualquier cambio que afecte de forma importante tu uso de la plataforma —
          incluyendo si en algún momento se introducen planes de pago.
        </p>
      </LegalSection>

      <LegalSection title="8. Límite de responsabilidad">
        <p>
          En la medida permitida por la ley, Adquion se ofrece "tal cual" y no
          garantizamos que el servicio esté libre de errores o interrupciones. No somos
          responsables por daños indirectos, pérdida de información o consecuencias
          fiscales derivadas del uso indebido de la plataforma, de credenciales
          compartidas sin autorización, o de decisiones tomadas únicamente con base en la
          información que Adquion procesa.
        </p>
      </LegalSection>

      <LegalSection title="9. Cambios a estos términos">
        <p>
          Podemos actualizar estos Términos conforme el proyecto evolucione. Los cambios
          importantes se anunciarán en la plataforma o por correo antes de entrar en
          vigor.
        </p>
      </LegalSection>

      <LegalSection title="10. Contacto">
        <p>
          ¿Dudas sobre estos términos? Escríbenos a{" "}
          <a href="mailto:contacto@converso.mx" className="font-semibold text-brand hover:underline">
            contacto@converso.mx
          </a>{" "}
          o usa nuestra{" "}
          <a href="/comentarios" className="font-semibold text-brand hover:underline">
            página de comentarios
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
