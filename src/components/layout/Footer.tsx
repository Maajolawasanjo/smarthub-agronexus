import Image from "next/image";
import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full bg-white relative mt-16 md:mt-56">

            {/* Newsletter Section */}
            <div className="w-full max-w-7xl mx-auto px-4 md:px-12 relative z-20 md:absolute md:-top-32 md:left-0 md:right-0">
                <div className="bg-[#2E6B34] rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between shadow-2xl relative overflow-hidden">

                    {/* Decorative Image */}
                    <div className="hidden md:block w-48 h-48 md:w-[400px] md:h-[350px] md:absolute md:-left-10 md:bottom-0 relative mb-6 md:mb-0 shrink-0">
                        <Image
                            src="/vegetable-container-white.png"
                            alt="Fresh Vegetables Container"
                            fill
                            className="object-contain"
                        />
                    </div>

                    {/* Desktop Spacer */}
                    <div className="hidden md:block w-1/3"></div>

                    {/* Content */}
                    <div className="flex flex-col w-full md:w-2/3 items-center md:items-end text-right gap-6 z-10">
                        <h3 className="text-white text-xl md:text-2xl font-light tracking-wide text-center md:text-right leading-tight">
                            Stay Updated on Price Trends & Product Availability.
                        </h3>

                        <div className="flex flex-col sm:flex-row w-full max-w-md bg-white rounded-full p-1.5 shadow-lg">
                            <div className="hidden sm:flex items-center pl-4 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-3 sm:px-3 text-gray-700 outline-none text-sm font-medium text-center sm:text-left"
                            />
                            <button className="bg-[#1B4D28] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#143d1f] transition-colors mt-2 sm:mt-0 w-full sm:w-auto shadow-md">
                                Subscribe
                            </button>
                        </div>


                    </div>
                </div>
            </div>

            {/* Footer Links & Info */}
            <div className="max-w-7xl mx-auto px-4 md:px-12 pt-16 md:pt-40">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20 text-center md:text-left">

                    {/* Brand & Socials */}
                    <div className="flex flex-col items-center md:items-start space-y-6">
                        <div className="flex flex-col md:flex-row items-center gap-3 mb-2">
                            <Image src="/LOGO.jpg" alt="Smarthub Agrochain Logo" width={40} height={40} className="rounded-full" />
                            <span className="font-bold text-xl text-[#1B4D28]">Smarthub Agrochain</span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed max-w-xs mx-auto md:mx-0">
                            Connecting Farms to <br /> Global Markets.
                        </p>

                        {/* Social Icons */}
                        <div className="flex items-center justify-center md:justify-start gap-4 text-gray-700">
                            <a href="#" className="hover:text-black transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path></svg></a>
                            <a href="#" className="hover:text-black transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12"></path></svg></a>
                            <a href="#" className="hover:text-black transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path><rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth={1.5}></rect></svg></a>
                            <a href="#" className="hover:text-black transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21l1.65-3.8a9 9 0 113.4 2.9L3 21"></path></svg></a>
                            <a href="#" className="hover:text-black transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path><circle cx="4" cy="4" r="2" strokeWidth={1.5}></circle></svg></a>
                        </div>
                    </div>

                    {/* Quick Link */}
                    <div className="flex flex-col items-center md:items-start md:block">
                        <h4 className="font-bold text-gray-800 mb-6 text-lg">Quick Link</h4>
                        <ul className="space-y-4 text-gray-500 text-sm">
                            <li><Link href="/" className="hover:text-[#1B4D28] transition-colors">Home</Link></li>
                            <li><Link href="/about" className="hover:text-[#1B4D28] transition-colors">About Us</Link></li>
                            <li><Link href="/contact" className="hover:text-[#1B4D28] transition-colors">Contact Us</Link></li>
                            <li><Link href="/terms" className="hover:text-[#1B4D28] transition-colors">Terms</Link></li>
                            <li><Link href="/privacy" className="hover:text-[#1B4D28] transition-colors">Privacy</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div className="flex flex-col items-center md:items-start md:block">
                        <h4 className="font-bold text-gray-800 mb-6 text-lg">Support</h4>
                        <ul className="space-y-4 text-gray-500 text-sm">
                            <li><Link href="/help" className="hover:text-[#1B4D28] transition-colors">Help center</Link></li>
                            <li><Link href="/feedback" className="hover:text-[#1B4D28] transition-colors">Feedback</Link></li>
                            <li><Link href="/tweet" className="hover:text-[#1B4D28] transition-colors">Tweet Us</Link></li>
                        </ul>
                    </div>

                    {/* Contact Us */}
                    <div className="flex flex-col items-center md:items-start md:block">
                        <h4 className="font-bold text-gray-800 mb-6 text-lg">Contact Us</h4>
                        <ul className="space-y-4 text-gray-500 text-sm">
                            <li className="flex items-center justify-center md:justify-start gap-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                <span>+2381334 000 000</span>
                            </li>
                            <li className="flex items-center justify-center md:justify-start gap-2">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                <span>Agrochain@yahoomail.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-gray-100 py-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
                    <p className="text-gray-500 text-sm text-center">
                        © Copyright by DesignFada. All right reserved
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm text-gray-500">
                        <Link href="/privacy" className="hover:text-black">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-black">Terms of Use</Link>
                        <Link href="/legal" className="hover:text-black">Legal</Link>
                        <Link href="/sitemap" className="hover:text-black">Site Map</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
