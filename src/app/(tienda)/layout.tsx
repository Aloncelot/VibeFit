import { CartProvider } from '@/context/cart-context';
import { getCliente } from '@/server/auth/cliente';
import SiteHeader from '@/components/store/site-header';
import SiteFooter from '@/components/store/site-footer';
import CartDrawer from '@/components/store/cart-drawer';
import AvisoPrivacidad from '@/components/legal/aviso-privacidad';

export default async function TiendaLayout({ children }: { children: React.ReactNode }) {
  const cliente = await getCliente();

  return (
    <CartProvider cliente={cliente}>
      <SiteHeader />
      <CartDrawer />
      <main id="contenido">{children}</main>
      <SiteFooter />
      <AvisoPrivacidad />
    </CartProvider>
  );
}
