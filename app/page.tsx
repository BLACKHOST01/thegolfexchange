import Navbar from "./components/NavBar";
import Footer from "./components/Footer";
import Hero from "./components/ui/Hero";
export default function Home() {
  return (
    <>
      {/* Header */}
      <header>
        <Navbar />
      </header>

      {/* Main Content */}
      <main className="">
       <Hero/>
       
      </main>

      {/* Footer */}
      <footer>
        <Footer />
      </footer>
    </>
  );
}
