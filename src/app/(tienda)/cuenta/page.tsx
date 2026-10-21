import type { Metadata } from 'next';
import { requireCliente } from '@/server/auth/cliente';
import { getFavoritosDetalle, getListasCliente, getNotificaciones, getSkusResumen } from '@/server/queries/cliente';
import { cerrarSesionCliente } from '@/server/actions/cliente-auth';
import Notificaciones from '@/components/cuenta/notificaciones';
import ListaProductos from '@/components/cuenta/lista-productos';
import LogoutButton from '@/components/cuenta/logout-button';
import EliminarCuenta from '@/components/cuenta/eliminar-cuenta';
import styles from '@/components/cuenta/cuenta.module.css';

export const metadata: Metadata = { title: 'Mi cuenta', robots: { index: false } };

export default async function CuentaPage() {
  const cliente = await requireCliente('/cuenta');

  const [listas, favoritos, notificaciones] = await Promise.all([
    getListasCliente(cliente.id),
    getFavoritosDetalle(cliente.id),
    getNotificaciones(cliente.id),
  ]);
  const conAviso = await getSkusResumen(listas.alertas);

  return (
    <div className={`container ${styles.cuenta}`}>
      <header className={styles.cuentaHead}>
        <h1>Hola, {cliente.nombre.split(' ')[0]}</h1>
        <form action={cerrarSesionCliente}>
          <LogoutButton />
        </form>
      </header>

      <Notificaciones items={notificaciones} />

      <ListaProductos
        id="avisos"
        titulo="Te avisaremos cuando vuelvan"
        vacio="No tienes avisos pendientes. En cualquier producto agotado puedes pedir que te avisemos."
        tipo="AVISO"
        items={conAviso}
      />
      <ListaProductos
        id="guardados"
        titulo="Guardado para después"
        vacio="Desde el carrito puedes guardar productos para comprarlos más adelante."
        tipo="GUARDADO"
        items={listas.guardados}
      />
      <ListaProductos
        id="favoritos"
        titulo="Favoritos"
        vacio="Toca el corazón en cualquier producto para guardarlo aquí."
        tipo="FAVORITO"
        items={favoritos}
      />

      <EliminarCuenta />
    </div>
  );
}
