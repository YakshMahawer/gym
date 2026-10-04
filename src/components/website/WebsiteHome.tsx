"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  ArrowRight,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Zap,
  Activity,
  Heart,
  Users,
  Calendar,
  X,
  Lock,
  ExternalLink,
} from "lucide-react";

export function WebsiteHome() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [lightboxImg, setLightboxImg] = useState<{ src: string; caption: string } | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const galleryImages = [
    {
      src: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop",
      caption: "The Strength Training Floor & Heavy Dumbbells",
      category: "Strength Floor",
    },
    {
      src: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1470&auto=format&fit=crop",
      caption: "Cardio Zone with High-End Running Treadmills",
      category: "Cardio Zone",
    },
    {
      src: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1475&auto=format&fit=crop",
      caption: "Modern Reception, Lounge & Assessment Desk",
      category: "Club Atmosphere",
    },
    {
      src: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop",
      caption: "Dedicated Personal Training & Biomechanics Area",
      category: "Personal Training",
    },
    {
      src: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1470&auto=format&fit=crop",
      caption: "Functional Conditioning & Free Weights Zone",
      category: "Functional Training",
    },
    {
      src: "https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=1469&auto=format&fit=crop",
      caption: "Elite Resistance & Cable Crossover Equipment",
      category: "Machines",
    },
  ];

  const faqs = [
    {
      q: "Where is Concept 1 located?",
      a: "Find us on the 1st floor of Dream Iconia, near Hans Party Plot, Manjalpur, Vadodara, Gujarat 390011. Tap the Directions button anytime to open Google Maps.",
    },
    {
      q: "How can I enquire about a gym membership?",
      a: "Message us directly on WhatsApp (+91 80006 64466) or call 08048055366. Our front desk team will share active packages, trial sessions, and seasonal discounts.",
    },
    {
      q: "Can I visit before joining?",
      a: "Yes! You are welcome to visit our training floor, test the machines, and meet our certified trainers before making a decision.",
    },
    {
      q: "What are the opening hours?",
      a: "Concept 1 is open 6 days a week with flexible morning (6:00 AM – 12:00 PM) and evening (4:00 PM – 10:00 PM) workout slots.",
    },
    {
      q: "Do you offer Personal Training (PT)?",
      a: "Yes. We have certified personal trainers dedicated to goal-based training including fat loss, muscle gain, postural correction, and strength conditioning.",
    },
    {
      q: "Is there a Day Pass available?",
      a: "Yes! In town for a day or want a single workout session? We offer a 1-Day Pass for ₹500 with full access to weights and cardio equipment.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 selection:bg-rose-600 selection:text-white font-sans antialiased overflow-x-hidden">
      
      {/* TOP NOTIFICATION / MINDSET TICKER */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-b border-rose-900/40 py-2 px-4 text-center overflow-hidden">
        <div className="inline-flex items-center gap-6 text-[11px] sm:text-xs font-semibold tracking-wider uppercase text-rose-200 animate-pulse">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>BUILD STRENGTH</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400" />
            <span>FIND YOUR BALANCE</span>
          </span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>MOVE WITH PURPOSE</span>
          </span>
          <span className="hidden lg:inline">•</span>
          <span className="hidden lg:flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>MAKE IT A HABIT</span>
          </span>
        </div>
      </div>

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#0d0f12]/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-rose-800 text-white flex items-center justify-center font-black shadow-lg shadow-rose-900/40 group-hover:scale-105 transition">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight text-white uppercase leading-none">
                Concept <span className="text-rose-500">1</span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase mt-0.5">
                Proactive Fitness
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wider text-slate-300 uppercase">
            <a href="#about" className="hover:text-rose-400 transition">About</a>
            <a href="#training" className="hover:text-rose-400 transition">Training</a>
            <a href="#gallery" className="hover:text-rose-400 transition">Gallery</a>
            <a href="#daypass" className="hover:text-rose-400 transition">Day Pass</a>
            <a href="#faq" className="hover:text-rose-400 transition">FAQs</a>
            <a href="#contact" className="hover:text-rose-400 transition">Contact</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Admin CRM Portal Link */}
            <Link
              href="/admin"
              className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shadow-xs"
              title="Open Staff Management CRM"
            >
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>CRM Portal</span>
            </Link>

            {/* Let's Get Started WhatsApp CTA */}
            <a
              href="https://wa.me/918000664466?text=Hi%20Concept%201!%20I'd%20like%20to%20know%20more%20about%20membership."
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition shadow-lg shadow-rose-900/30 active:scale-95"
            >
              <span>Let&apos;s Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="p-2 text-slate-400 hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? <X className="w-6 h-6" /> : (
                <div className="w-6 space-y-1.5">
                  <div className="h-0.5 bg-slate-300 rounded-full" />
                  <div className="h-0.5 bg-slate-300 rounded-full w-4" />
                  <div className="h-0.5 bg-slate-300 rounded-full" />
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileNavOpen && (
          <div className="md:hidden bg-[#13161c] border-b border-slate-800 px-5 py-4 space-y-3 animate-in slide-in-from-top duration-150">
            <nav className="grid grid-cols-2 gap-2 text-xs font-semibold uppercase text-slate-300">
              <a onClick={() => setMobileNavOpen(false)} href="#about" className="p-2 hover:bg-slate-800 rounded">About</a>
              <a onClick={() => setMobileNavOpen(false)} href="#training" className="p-2 hover:bg-slate-800 rounded">Training</a>
              <a onClick={() => setMobileNavOpen(false)} href="#gallery" className="p-2 hover:bg-slate-800 rounded">Gallery</a>
              <a onClick={() => setMobileNavOpen(false)} href="#daypass" className="p-2 hover:bg-slate-800 rounded">Day Pass</a>
              <a onClick={() => setMobileNavOpen(false)} href="#faq" className="p-2 hover:bg-slate-800 rounded">FAQs</a>
              <a onClick={() => setMobileNavOpen(false)} href="#contact" className="p-2 hover:bg-slate-800 rounded">Contact</a>
            </nav>
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
              <a
                href="https://wa.me/918000664466?text=Hi%20Concept%201!%20I'd%20like%20to%20plan%20a%20visit."
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-rose-600 text-white rounded-xl text-xs font-bold text-center uppercase flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Join on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden py-16 sm:py-24">
        {/* Background Image with Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1920&auto=format&fit=crop"
            alt="Concept 1 Gym Interior Training Floor"
            className="w-full h-full object-cover object-center opacity-30 scale-105 animate-in fade-in duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/85 to-[#0d0f12]/50" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-950/20 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Location Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-rose-500/30 text-rose-300 text-xs font-semibold tracking-wider uppercase shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>GYM IN MANJALPUR, VADODARA</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase leading-[1.08] drop-shadow-md">
            IT STARTS <br className="hidden sm:inline" />
            WITH <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400">YOU.</span>
          </h1>

          {/* Subtitle */}
          <p className="max-w-2xl mx-auto text-sm sm:text-lg text-slate-300 font-normal leading-relaxed">
            Meet <strong>Concept 1</strong>, your premier fitness destination in Manjalpur.
            Explore our state-of-the-art training floor, find your cardio rhythm, and take the first step towards your strongest self.
          </p>

          {/* Action CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <a
              href="https://wa.me/918000664466?text=Hi%20Concept%201!%20I'd%20like%20to%20plan%20a%20visit."
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto px-7 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold tracking-wider uppercase transition shadow-xl shadow-rose-900/40 flex items-center justify-center gap-2 active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>FIND YOUR STRONG</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#training"
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold tracking-wider uppercase border border-slate-700/80 transition flex items-center justify-center gap-2"
            >
              <span>Explore the Club</span>
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Note Banner */}
          <div className="pt-8 flex items-center justify-center gap-3 text-xs text-slate-400 uppercase tracking-widest font-semibold">
            <span className="w-8 h-px bg-slate-700" />
            <span>ONE CONCEPT. A STRONGER YOU.</span>
            <span className="w-8 h-px bg-slate-700" />
          </div>
        </div>
      </section>

      {/* SECTION 1: THE CONCEPT (TRAINING & CARDIO) */}
      <section id="training" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs font-bold text-rose-500 tracking-widest uppercase block mb-1">
              01 / THE CONCEPT
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              MORE THAN A WORKOUT. <br />
              <span className="text-slate-400">A WAY FORWARD.</span>
            </h2>
          </div>
          <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
            Big ambitions start with small, consistent steps. Find your rhythm in a space specifically engineered for athletic progression.
          </p>
        </div>

        {/* Big Interactive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Strength Floor */}
          <div className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl h-80 sm:h-96 flex flex-col justify-end p-6 sm:p-8">
            <img
              src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop"
              alt="The Training Floor"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/60 to-transparent" />
            
            <div className="relative z-10 space-y-2">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider bg-rose-950/60 border border-rose-800/40 px-2.5 py-1 rounded-md inline-block">
                THE TRAINING FLOOR
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase">
                Make Room for Progress.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                Heavy free weights, Olympic barbells, plate-loaded machines, and cable systems built for maximum muscle activation.
              </p>
            </div>
          </div>

          {/* Card 2: Cardio Zone */}
          <div className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl h-80 sm:h-96 flex flex-col justify-end p-6 sm:p-8">
            <img
              src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=1200&auto=format&fit=crop"
              alt="Cardio Area"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-[#0d0f12]/60 to-transparent" />
            
            <div className="relative z-10 space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider bg-amber-950/60 border border-amber-800/40 px-2.5 py-1 rounded-md inline-block">
                CARDIO ZONE
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white uppercase">
                Find Your Pace.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300">
                High-end shock-absorbing treadmills, cross-trainers, and spin bikes to boost your stamina and burn calories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: OUR STORY / ABOUT */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-800 shadow-2xl h-80 sm:h-[420px]">
            <img
              src="https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1200&auto=format&fit=crop"
              alt="Concept 1 Reception Entrance Vadodara"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0d0f12] via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/60 text-xs font-semibold text-slate-200">
              📍 1st Floor, Dream Iconia, Nr. Hans Party Plot, Manjalpur
            </div>
          </div>

          <div className="lg:col-span-7 space-y-6">
            <span className="text-xs font-bold text-rose-500 tracking-widest uppercase block">
              02 / OUR STORY
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tight">
              ONE CONCEPT. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-400">
                YOUR POTENTIAL.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              <strong>Concept 1 Proactive Fitness</strong> is your neighbourhood fitness destination in Manjalpur, Vadodara. A place to put yourself first, build a consistent routine, and keep moving forward—one workout at a time.
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Whether you are an experienced lifter or stepping into a gym for the first time, our community, certified personal trainers, and motivating atmosphere are here to support every step of your fitness journey.
            </p>

            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Floor Space</span>
                <span className="font-bold text-white text-sm">Spacious & Clean</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Trainers</span>
                <span className="font-bold text-white text-sm">Certified & Active</span>
              </div>
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block text-[11px]">Community</span>
                <span className="font-bold text-white text-sm">Motivating</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: GALLERY & CLUB PHOTO PREVIEW */}
      <section id="gallery" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-xs font-bold text-rose-500 tracking-widest uppercase block mb-1">
              03 / INSIDE THE CLUB
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
              PICTURE YOURSELF HERE.
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Click any photograph to view high resolution preview.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {galleryImages.map((img, idx) => (
            <div
              key={idx}
              onClick={() => setLightboxImg(img)}
              className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-md aspect-4/3 cursor-pointer"
            >
              <img
                src={img.src}
                alt={img.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition" />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-white">
                <div>
                  <span className="text-[10px] text-rose-400 uppercase font-bold block">{img.category}</span>
                  <span className="font-semibold text-slate-200 line-clamp-1">{img.caption}</span>
                </div>
                <div className="p-1.5 bg-white/10 rounded-lg backdrop-blur-xs group-hover:bg-rose-600 transition">
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: 1-DAY PASS BANNER */}
      <section id="daypass" className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-rose-950 via-slate-900 to-slate-900 border border-rose-800/40 p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-rose-400 tracking-widest uppercase bg-rose-900/50 px-3 py-1 rounded-full inline-block">
              IN TOWN FOR A DAY?
            </span>
            <h3 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              ONE DAY. <span className="text-amber-400">₹500.</span>
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm max-w-md">
              Your schedule, your visit. Access our complete weight training and cardio facilities with our flexible Day Pass.
            </p>
          </div>

          <a
            href="https://wa.me/918000664466?text=Hi%20Concept%201!%20I'd%20like%20to%20get%20a%20One%20Day%20Gym%20Pass."
            target="_blank"
            rel="noreferrer"
            className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm rounded-xl uppercase tracking-wider shadow-xl shadow-rose-900/50 transition active:scale-95 shrink-0 flex items-center gap-2"
          >
            <span>GET A DAY PASS</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* SECTION 5: FREQUENTLY ASKED QUESTIONS */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-slate-800/80">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold text-rose-500 tracking-widest uppercase block">
            A LITTLE CLARITY
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
            BEFORE YOU BEGIN.
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="bg-slate-900/80 rounded-2xl border border-slate-800/80 overflow-hidden transition"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm text-slate-100 hover:text-rose-400 transition"
                >
                  <span>{item.q}</span>
                  <span className={`p-1 rounded-lg bg-slate-800 text-slate-400 text-sm transition-transform duration-200 ${isOpen ? "rotate-180 text-rose-400" : ""}`}>
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in duration-150">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 6: FINAL JOIN CALL TO ACTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/80 text-center space-y-6">
        <span className="text-xs font-bold text-rose-500 tracking-widest uppercase block">
          YOUR FIRST STEP
        </span>
        <h2 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
          MAKE TODAY <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-amber-400">
            YOUR DAY ONE.
          </span>
        </h2>
        <p className="max-w-xl mx-auto text-xs sm:text-sm text-slate-300">
          Come see the training space. Ask your questions. Let&apos;s find your way forward together.
        </p>
        <div className="pt-2">
          <a
            href="https://wa.me/918000664466?text=Hi%20Concept%201!%20I'd%20like%20to%20plan%20a%20visit."
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider shadow-xl shadow-rose-900/40 active:scale-95 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span>LET&apos;S TALK FITNESS</span>
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="bg-[#090a0d] border-t border-slate-800/90 py-12 px-4 sm:px-6 lg:px-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span className="font-black text-sm text-white tracking-tight uppercase">
                Concept 1 <span className="text-rose-500">Gym</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Proactive fitness. Built for your everyday progress.
            </p>
            <p className="text-[11px] text-slate-500">
              GSTIN: <span className="text-slate-400 font-mono">07AAACA1234F1Z8</span>
            </p>
          </div>

          {/* Col 2: Location */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">Location</h4>
            <p className="text-slate-300 leading-relaxed">
              1st floor, Dream Iconia,<br />
              Near Hans Party Plot, Manjalpur,<br />
              Vadodara, Gujarat 390011
            </p>
            <a
              href="https://maps.app.goo.gl/hQHYAqrn836gj3Fx5"
              target="_blank"
              rel="noreferrer"
              className="text-rose-400 hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Find us on Google Maps ↗</span>
            </a>
          </div>

          {/* Col 3: Contact */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">Direct Contact</h4>
            <p className="text-slate-300">
              Call: <a href="tel:+918048055366" className="text-white hover:text-rose-400 font-semibold">08048055366</a>
            </p>
            <p className="text-slate-300">
              WhatsApp: <a href="https://wa.me/918000664466" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-semibold">+91 80006 64466</a>
            </p>
            <p className="text-slate-400 text-[11px]">
              Email: info@concept1.co
            </p>
          </div>

          {/* Col 4: Quick Links / Admin Portal */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-200 uppercase tracking-wider text-xs">Portals & Links</h4>
            <div className="flex flex-col space-y-1.5">
              <Link href="/admin" className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                <span>Manager / Admin CRM Portal →</span>
              </Link>
              <a href="#training" className="hover:text-slate-200">Training Floor</a>
              <a href="#gallery" className="hover:text-slate-200">Photo Gallery</a>
              <a href="#daypass" className="hover:text-slate-200">1-Day Pass (₹500)</a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Concept 1 Gym &amp; Fitness · Vadodara, Gujarat</p>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="hover:text-slate-300 font-semibold">Admin Login</Link>
            <span>•</span>
            <a href="https://maps.app.goo.gl/hQHYAqrn836gj3Fx5" target="_blank" rel="noreferrer" className="hover:text-slate-300">Directions</a>
          </div>
        </div>
      </footer>

      {/* FLOATING QUICK CONTACT DOCK (Bottom Right) */}
      <aside className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700 shadow-2xl">
        <a
          href="https://wa.me/918000664466?text=Hi%20Concept%201!%20I'd%20like%20to%20know%20about%20membership."
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">WhatsApp</span>
        </a>

        <a
          href="tel:+918048055366"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition"
          title="Call Gym Desk"
        >
          <Phone className="w-4 h-4" />
        </a>

        <a
          href="https://maps.app.goo.gl/hQHYAqrn836gj3Fx5"
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition"
          title="Google Maps Location"
        >
          <MapPin className="w-4 h-4" />
        </a>
      </aside>

      {/* LIGHTBOX MODAL */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl"
          >
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={lightboxImg.src}
              alt={lightboxImg.caption}
              className="w-full max-h-[75vh] object-contain bg-black"
            />
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-center">
              <p className="font-semibold text-xs sm:text-sm text-slate-200">{lightboxImg.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
