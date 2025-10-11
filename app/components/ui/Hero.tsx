import React from "react";

import logoimg from "@/public/1035.webp";
import Link from "next/link";
import Image from "next/image";
import { global } from "styled-jsx/css";

const Hero = () => {
  return (
    <div className=" md:h-screen h-auto  hero flex items-center px-4  bg-transparent bg-hero-pattern bg-cover bg-center bg-no-repeat">
      <div className="container mx-auto  sm:py-16">
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between">
          <div className="w-full sm:w-1/2 mt-0 sm:mt-0 pb-20">
            <h1 className="text-3xl text-green-800 sm:text-4xl md:text-5xl text-wrap lg:text-6xl font-bold uppercase mb-4 sm:mb-6">
              Welcome to The Golf Exchange
            </h1>
            <p className="text-base font-bold text-white sm:text-lg md:text-xl mb-4 sm:mb-6">
              Explore premium golf equipment, connect with fellow players, and
              stay updated with the latest tournaments and tips.
            </p>

            <Link href="/get">
              <button className="w-full sm:w-auto bg-green-600  font-bold py-2 px-6 sm:px-9 rounded-lg hover:bg-black transition duration-300">
                View inventory
              </button>
            </Link>
          </div>
          <div className="w-56 md:w-1/2 sm:w-11/12 sm:pl-9">
            <Image
              src={logoimg}
              alt="Golf with tees"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
