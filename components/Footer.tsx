/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Github, Linkedin } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-sm p-3 z-50 text-neutral-300 text-xs sm:text-sm border-t border-white/10">
            <div className="max-w-screen-xl mx-auto flex justify-between items-center gap-4 px-4">
                <div className="hidden md:flex items-center gap-4 text-neutral-500 whitespace-nowrap text-xs">
                    <p>Powered by Gemini 2.5 Flash</p>
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors hidden lg:block">Privacy Policy</a>
                    <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-300 transition-colors hidden lg:block">Terms of Service</a>
                </div>

                {/* Right Side */}
                <div className="flex-grow flex justify-end items-center gap-6">
                    <div className="text-neutral-400 text-sm">
                        <span>Designed by </span>
                        <span className="font-medium text-neutral-200">kutluhangil</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <a
                            href="https://github.com/kutluhangil"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-white transition-colors duration-300 hover:scale-110"
                            title="GitHub"
                            aria-label="GitHub"
                        >
                            <Github className="w-5 h-5" />
                        </a>
                        <a
                            href="https://www.linkedin.com/in/kutluhangil/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neutral-400 hover:text-white transition-colors duration-300 hover:scale-110"
                            title="LinkedIn"
                            aria-label="LinkedIn"
                        >
                            <Linkedin className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
