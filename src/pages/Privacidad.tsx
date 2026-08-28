import { LegalLayout, LegalSection } from "@/components/LegalLayout";

export default function Privacidad() {
  return (
    <LegalLayout title="Política de Privacidad" updatedAt="28 de agosto de 2026">
      <LegalSection title="1. Responsable de tus datos">
        <p>
          Adquion es responsable del tratamiento de los datos personales que nos
          proporcionas al usar la plataforma, conforme a la Ley Federal de Protección de
          Datos Personales en Posesión de los Particulares (LFPDPPP) de México.
        </p>
      </LegalSection>

      <LegalSection title="2. Qué datos recopilamos">
        <ul>
          <li>Datos de cuenta: nombre, correo electrónico, teléfono y contraseña (cifrada).</li>
          <li>Datos de tu organización: nombre de la empresa/negocio y RFC que conectas.</li>
          <li>
            Documentos fiscales que Adquion descarga del SAT en tu nombre (CFDI,
            constancias, opiniones de cumplimiento) y su historial de procesamiento.
          </li>
          <li>Datos de uso: acciones dentro de la plataforma, para dar soporte y mejorar el servicio.</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. Para qué usamos tus datos">
        <ul>
          <li>Prestar el servicio: autenticarte, descargar y organizar tu información fiscal.</li>
          <li>Enviarte notificaciones que tú mismo configuras (WhatsApp, correo).</li>
          <li>Dar soporte cuando nos escribes con una duda, queja o sugerencia.</li>
          <li>Mejorar la plataforma con base en el uso agregado, sin identificarte individualmente.</li>
        </ul>
        <p>No usamos tus datos para venderlos a terceros ni para publicidad de terceros.</p>
      </LegalSection>

      <LegalSection title="4. Cómo protegemos tu información">
        <p>
          De nuestro lado, la plataforma está construida con seguridad como prioridad:
          sesiones manejadas con cookies cifradas de solo servidor, contraseñas
          almacenadas cifradas, acceso a la información restringido por rol y organización,
          y comunicación cifrada (HTTPS) en todo momento. Seguimos mejorando estas medidas
          conforme crece el proyecto.
        </p>
      </LegalSection>

      <LegalSection title="5. Con quién compartimos información">
        <p>Compartimos información únicamente con proveedores necesarios para operar el servicio:</p>
        <ul>
          <li>Infraestructura de hosting y base de datos donde vive la plataforma.</li>
          <li>Un proveedor externo de mensajería para enviar tus notificaciones por WhatsApp Business.</li>
          <li>El SAT, únicamente para realizar las descargas que tú autorizas con tu RFC.</li>
        </ul>
        <p>No compartimos tu información con nadie más sin tu consentimiento, salvo que la ley nos obligue.</p>
      </LegalSection>

      <LegalSection title="6. Tu responsabilidad sobre datos de terceros">
        <p>
          Si usas Adquion para gestionar información de tus propios clientes o
          contribuyentes (por ejemplo, como contador que administra varias
          organizaciones), tú eres responsable de contar con la autorización necesaria de
          esas personas y de cumplir tus propias obligaciones de protección de datos
          frente a ellas. Adquion actúa como la herramienta que procesa esa información
          por tu instrucción, no como quien decide cómo se usa.
        </p>
      </LegalSection>

      <LegalSection title="7. Tus derechos (ARCO)">
        <p>
          Puedes solicitar en cualquier momento el Acceso, Rectificación, Cancelación u
          Oposición (derechos ARCO) sobre tus datos personales, así como pedir que
          eliminemos tu cuenta y la información asociada. Escríbenos a{" "}
          <a href="mailto:contacto@converso.mx" className="font-semibold text-brand hover:underline">
            contacto@converso.mx
          </a>{" "}
          y atenderemos tu solicitud.
        </p>
      </LegalSection>

      <LegalSection title="8. Cookies">
        <p>
          Usamos una cookie de sesión, cifrada y de solo servidor (httpOnly), estrictamente
          necesaria para mantenerte autenticado. No usamos cookies de rastreo publicitario
          de terceros.
        </p>
      </LegalSection>

      <LegalSection title="9. Cambios a este aviso">
        <p>
          Podemos actualizar esta Política de Privacidad conforme evolucione el proyecto.
          Los cambios importantes se anunciarán en la plataforma antes de entrar en vigor.
        </p>
      </LegalSection>

      <LegalSection title="10. Contacto">
        <p>
          Para cualquier duda sobre esta política o el manejo de tus datos, escríbenos a{" "}
          <a href="mailto:contacto@converso.mx" className="font-semibold text-brand hover:underline">
            contacto@converso.mx
          </a>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
