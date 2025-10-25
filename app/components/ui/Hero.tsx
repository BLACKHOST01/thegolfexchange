import React from "react";
import logoimg from "@/public/1035.webp";
import Link from "next/link";
import Image from "next/image";

const Hero = () => {
  return (
    <section 
      className="min-h-screen hero flex items-center px-4 bg-transparent bg-hero-pattern bg-cover bg-center bg-no-repeat"
      aria-label="Hero section"
    >
      <div className="container mx-auto py-8 sm:py-16">
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-8">
          {/* Text Content */}
          <div className="w-full sm:w-1/2 flex flex-col items-start">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold uppercase mb-4 sm:mb-6 text-green-800 leading-tight">
              Welcome to The Golf Exchange
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 font-bold text-white max-w-lg leading-relaxed">
              Explore premium golf equipment, connect with fellow players, and
              stay updated with the latest tournaments and tips.
            </p>

            <Link 
              href="/shop" 
              className="w-full sm:w-auto inline-block"
            >
              <button 
                className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-green-300 focus:outline-none"
              >
                View inventory
              </button>
            </Link>
          </div>

          {/* Image Content */}
          <div className="w-full sm:w-1/2 flex justify-center sm:justify-end">
            <div className="w-64 sm:w-80 md:w-96 lg:w-auto max-w-md">
              <Image
                src={logoimg}
                alt="Golf equipment and tees on a green golf course"
                className="w-full h-auto rounded-lg shadow-lg"
                priority
                placeholder="blur"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;