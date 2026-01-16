// Imports are handled by next.js, but we need to ensure global CSS is active
import "./auth.css";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      className="auth-layout w-full min-h-screen lg:py-7 lg:flex lg:items-center justify-center relative bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("/authPage/auth_background_minimal.png")' }}
    >
      {/* Overlay for better text readability if needed, though we have a card */}
      <div className="absolute inset-0 bg-white/30 z-0 pointer-events-none" />

      {/* Mobile Background Layer - Keeping legacy specific mobile asset if desired, or we can let the main bg cover all. 
           Commented out to let the new premium background shine everywhere. 
       */}
      {/* 
       <div 
         className="absolute inset-0 z-0 bg-contain bg-no-repeat bg-bottom lg:hidden pointer-events-none"
         style={{ backgroundImage: 'url("/authPage/authBgMobile.png")' }}
       /> 
       */}

      {/* Main Card Container */}
      <section className="relative z-10 w-full h-full lg:h-auto lg:bg-white/95 lg:min-w-[46.875rem] lg:max-w-[46.875rem] lg:mx-auto lg:rounded-3xl p-6 lg:p-10 shadow-xl backdrop-blur-sm">
        {children}
      </section>
    </div>
  );
}
