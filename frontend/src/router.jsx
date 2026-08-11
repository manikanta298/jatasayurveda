import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import App from "./App";

// Every route below is code-split via React.lazy — a first-time visitor to
// the homepage no longer has to download and execute the entire admin
// panel's code (editors, dashboard charts, user management, etc.) before
// the page can even render. Vite/Rollup automatically gives each of these
// its own chunk, fetched only when that route is actually visited. See
// App.jsx for how this coordinates with the boot loader in index.html.
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const ProductsList = lazy(() => import("./pages/ProductsList"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const ServicesList = lazy(() => import("./pages/ServicesList"));
const ServiceDetail = lazy(() => import("./pages/ServiceDetail"));
const BlogList = lazy(() => import("./pages/BlogList"));
const BlogDetail = lazy(() => import("./pages/BlogDetail"));
const Research = lazy(() => import("./pages/Research"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const Orders = lazy(() => import("./pages/Orders"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const OrdersList = lazy(() => import("./pages/admin/OrdersList"));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const OrderInvoice = lazy(() => import("./pages/admin/OrderInvoice"));
const ProductsAdminList = lazy(() => import("./pages/admin/ProductsAdminList"));
const ProductEditor = lazy(() => import("./pages/admin/ProductEditor"));
const BlogAdminList = lazy(() => import("./pages/admin/BlogAdminList"));
const BlogEditor = lazy(() => import("./pages/admin/BlogEditor"));
const ServicesAdminList = lazy(() => import("./pages/admin/ServicesAdminList"));
const ServiceEditor = lazy(() => import("./pages/admin/ServiceEditor"));
const CategoriesAdmin = lazy(() => import("./pages/admin/CategoriesAdmin"));
const SettingsAdmin = lazy(() => import("./pages/admin/SettingsAdmin"));
const UsersAdmin = lazy(() => import("./pages/admin/UsersAdmin"));

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<App />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="products" element={<ProductsList />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route path="services" element={<ServicesList />} />
        <Route path="services/:slug" element={<ServiceDetail />} />
        <Route path="blog" element={<BlogList />} />
        <Route path="blog/:slug" element={<BlogDetail />} />
        <Route path="research" element={<Research />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order/:orderNumber" element={<OrderTracking />} />
        <Route path="auth" element={<Login />} />
        <Route path="profile" element={<Profile />} />
        <Route path="orders" element={<Orders />} />
        <Route path="privacy-policy" element={<LegalPage slug="privacy-policy" />} />
        <Route path="refund-policy" element={<LegalPage slug="refund-policy" />} />
        <Route path="return-policy" element={<LegalPage slug="return-policy" />} />
        <Route path="terms-and-conditions" element={<LegalPage slug="terms-and-conditions" />} />
        <Route path="shipping-policy" element={<LegalPage slug="shipping-policy" />} />

        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<OrdersList />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="orders/:id/invoice" element={<OrderInvoice />} />
          <Route path="products" element={<ProductsAdminList />} />
          <Route path="products/new" element={<ProductEditor />} />
          <Route path="products/:id" element={<ProductEditor />} />
          <Route path="blog" element={<BlogAdminList />} />
          <Route path="blog/new" element={<BlogEditor />} />
          <Route path="blog/:id" element={<BlogEditor />} />
          <Route path="services" element={<ServicesAdminList />} />
          <Route path="services/new" element={<ServiceEditor />} />
          <Route path="services/:id" element={<ServiceEditor />} />
          <Route path="categories" element={<CategoriesAdmin />} />
          <Route path="settings" element={<SettingsAdmin />} />
          <Route path="users" element={<UsersAdmin />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
