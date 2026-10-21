import type { Metadata } from 'next';
import Link from 'next/link';
import { LEGAL } from '@/content/legal';
import { formatFecha } from '@/content/recetas';
import styles from '@/components/legal/legal.module.css';

export const metadata: Metadata = {
  title: 'Aviso de privacidad y cookies',
  description: 'Qué datos personales recaba VIBEFIT, para qué los usa, cómo ejercer tus derechos ARCO y qué cookies utiliza.',
};

export default function PrivacidadPage() {
  return (
    <article className={styles.page}>
      <div className={`container ${styles.layout}`}>
        <header className={styles.head}>
          <h1>Aviso de privacidad</h1>
          <p>
            Aviso de privacidad integral conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.
            Última actualización: {formatFecha(LEGAL.actualizado)}.
          </p>
          <nav aria-label="Contenido" className={styles.toc}>
            <ol>
              <li><a href="#responsable">Responsable</a></li>
              <li><a href="#datos">Datos que recabamos</a></li>
              <li><a href="#finalidades">Para qué los usamos</a></li>
              <li><a href="#terceros">Con quién los compartimos</a></li>
              <li><a href="#arco">Tus derechos (ARCO)</a></li>
              <li><a href="#cookies">Cookies y almacenamiento</a></li>
              <li><a href="#seguridad">Seguridad y conservación</a></li>
              <li><a href="#cambios">Cambios a este aviso</a></li>
            </ol>
          </nav>
        </header>

        <div className={styles.body}>
          <section id="responsable">
            <h2>1. Responsable</h2>
            <p>
              <strong>{LEGAL.responsable}</strong>, que opera la tienda en línea VIBEFIT, con domicilio en {LEGAL.domicilio}, es
              responsable del tratamiento de tus datos personales. Para cualquier tema de privacidad escríbenos a{' '}
              <a href={`mailto:${LEGAL.correoPrivacidad}`}>{LEGAL.correoPrivacidad}</a>.
            </p>
          </section>

          <section id="datos">
            <h2>2. Datos que recabamos</h2>
            <p>Solo pedimos lo necesario para que la tienda funcione. No recabamos datos sensibles.</p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Cuándo</th>
                  <th scope="col">Datos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Al crear tu cuenta</td>
                  <td>Nombre, correo electrónico y contraseña. La contraseña se guarda cifrada; nadie en VIBEFIT puede verla.</td>
                </tr>
                <tr>
                  <td>Al usar tu cuenta</td>
                  <td>Productos de tu carrito, favoritos, guardados para después, avisos de existencia que pidas y los avisos que te enviamos.</td>
                </tr>
                <tr>
                  <td>Al dejar una reseña</td>
                  <td>Calificación y comentario. Se publican con tu nombre y la inicial de tu apellido.</td>
                </tr>
                <tr>
                  <td>Al solicitar un producto</td>
                  <td>El producto que buscas y, si decides darlo, tu correo para avisarte.</td>
                </tr>
                <tr>
                  <td>Al navegar</td>
                  <td>
                    Tu dirección IP se usa de forma temporal para limitar intentos de acceso y proteger la tienda contra abusos. No la
                    guardamos en nuestra base de datos.
                  </td>
                </tr>
              </tbody>
            </table>
            <p>Si compras como invitado, no creamos una cuenta ni guardamos tus datos de navegación.</p>
          </section>

          <section id="finalidades">
            <h2>3. Para qué usamos tus datos</h2>
            <h3>Finalidades necesarias</h3>
            <ul>
              <li>Crear y administrar tu cuenta e iniciar tu sesión.</li>
              <li>Guardar tu carrito, favoritos y productos para después en todos tus dispositivos.</li>
              <li>Avisarte cuando vuelva a haber existencia de un producto que pediste.</li>
              <li>Procesar tus pedidos y atender aclaraciones.</li>
              <li>Publicar las reseñas que decidas escribir.</li>
            </ul>
            <h3>Uso interno sin identificarte</h3>
            <p>
              Contamos de forma agregada cuántas personas piden, guardan o marcan como favorito cada producto para decidir qué comprar a
              proveedores. Esa información solo la ve el equipo de VIBEFIT.
            </p>
            <h3>Lo que no hacemos</h3>
            <ul>
              <li>No vendemos, rentamos ni intercambiamos tus datos personales.</li>
              <li>No te enviamos publicidad ni boletines sin que lo pidas.</li>
              <li>No usamos tus datos para perfiles publicitarios ni los compartimos con redes de anuncios.</li>
            </ul>
          </section>

          <section id="terceros">
            <h2>4. Con quién los compartimos</h2>
            <p>
              No transferimos tus datos a terceros para sus propios fines. Usamos proveedores que tratan datos únicamente por nuestra
              cuenta y bajo nuestras instrucciones (encargados):
            </p>
            <ul>
              <li>Microsoft Azure: alojamiento de la base de datos.</li>
              <li>Cloudinary: almacenamiento de fotos de productos (no contiene datos tuyos).</li>
              <li>El servicio de correo que usemos para enviarte avisos, cuando esté activo.</li>
              <li>
                El procesador de pagos, cuando esté activo. Los datos de tu tarjeta los captura directamente el procesador; VIBEFIT no
                los recibe ni los guarda.
              </li>
            </ul>
            <p>Solo entregaríamos datos a una autoridad cuando una ley o una orden judicial lo exija.</p>
          </section>

          <section id="arco">
            <h2>5. Tus derechos (ARCO) y cómo ejercerlos</h2>
            <p>
              Puedes <strong>acceder</strong> a tus datos, <strong>rectificarlos</strong>, <strong>cancelarlos</strong> u{' '}
              <strong>oponerte</strong> a su uso, así como revocar tu consentimiento o limitar su uso. Para hacerlo:
            </p>
            <ul>
              <li>
                Desde <Link href="/cuenta">Mi cuenta</Link> puedes borrar tus listas o eliminar tu cuenta y todos sus datos; tu
                reseña la editas o borras en <Link href="/resenas">Reseñas</Link>.
              </li>
              <li>
                O escribe a <a href={`mailto:${LEGAL.correoPrivacidad}`}>{LEGAL.correoPrivacidad}</a> desde el correo de tu cuenta, con tu
                nombre, el derecho que quieres ejercer y una descripción de lo que solicitas.
              </li>
            </ul>
            <p>
              Te responderemos en un máximo de 20 días hábiles. Si consideras que tu solicitud no fue atendida, puedes acudir ante la
              autoridad en materia de protección de datos personales (la Secretaría Anticorrupción y Buen Gobierno).
            </p>
          </section>

          <section id="cookies">
            <h2>6. Cookies y almacenamiento en tu navegador</h2>
            <p>
              VIBEFIT <strong>no usa cookies de publicidad ni de analítica</strong>. Solo usamos lo indispensable para que la tienda
              funcione, por eso no te pedimos aceptar cookies.
            </p>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Para qué</th>
                  <th scope="col">Duración</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>vibefit_cliente</code></td>
                  <td>Cookie esencial</td>
                  <td>Mantener tu sesión iniciada. Solo se crea si entras a tu cuenta.</td>
                  <td>30 días o hasta que salgas</td>
                </tr>
                <tr>
                  <td><code>vibefit_admin</code></td>
                  <td>Cookie esencial</td>
                  <td>Sesión del personal en el panel de administración. Los clientes nunca la reciben.</td>
                  <td>8 horas</td>
                </tr>
                <tr>
                  <td><code>vibefit-carrito-v1</code></td>
                  <td>Almacenamiento local</td>
                  <td>Recordar tu carrito en este navegador, aunque no tengas cuenta. Se borra al cerrar sesión.</td>
                  <td>Hasta que lo vacíes</td>
                </tr>
                <tr>
                  <td><code>vibefit-aviso-privacidad-v1</code></td>
                  <td>Almacenamiento local</td>
                  <td>Recordar que ya cerraste el aviso de privacidad para no volver a mostrarlo.</td>
                  <td>Hasta que borres los datos del sitio</td>
                </tr>
              </tbody>
            </table>
            <p>
              Puedes borrar estos datos desde la configuración de tu navegador. Si lo haces, se cerrará tu sesión y se vaciará el carrito
              guardado en ese navegador.
            </p>
          </section>

          <section id="seguridad">
            <h2>7. Seguridad y conservación</h2>
            <p>
              Protegemos tus datos con conexiones cifradas, contraseñas cifradas, sesiones firmadas y acceso restringido al panel de
              administración. Conservamos tus datos mientras tengas una cuenta; si la eliminas, borramos tu información personal, tus
              listas y tu reseña.
            </p>
          </section>

          <section id="cambios">
            <h2>8. Cambios a este aviso</h2>
            <p>
              Si cambiamos este aviso, publicaremos la nueva versión en esta página con su fecha de actualización. Si el cambio afecta
              cómo usamos datos que ya nos diste, te lo avisaremos en tu cuenta.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
