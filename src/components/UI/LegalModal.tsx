import React from 'react';
import { motion } from 'motion/react';
import { X, Shield, FileText, Scale, Landmark, Calendar, MapPin, EyeOff } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'privacy';
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const isTerms = type === 'terms';

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.4 }}
        className="relative bg-rsu-card border border-rsu-border rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-rsu-text dark:text-neutral-200"
      >
        {/* Header Ribbon / University Stripe */}
        <div className="h-1.5 bg-gradient-to-r from-rsu-navy via-rsu-orange to-rsu-green w-full" />

        {/* Header Block */}
        <div className="p-6 md:p-8 border-b border-rsu-border bg-slate-50 dark:bg-neutral-900/50 flex items-start justify-between gap-4">
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-rsu-navy/10 text-rsu-navy rounded-2xl flex-shrink-0 dark:bg-rsu-green/10 dark:text-rsu-green">
              {isTerms ? <FileText size={28} /> : <Shield size={28} />}
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-display font-black uppercase tracking-tight text-rsu-navy dark:text-white leading-tight">
                {isTerms ? 'Terms of Service' : 'Privacy Policy'}
              </h2>
              <p className="text-[10px] uppercase font-bold text-rsu-orange tracking-widest mt-0.5">
                RSU Campus Map & Timetable Navigation System
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-rsu-muted">
                <span><strong>Date:</strong> May 25, 2026</span>
                <span><strong>Status:</strong> {isTerms ? 'Version 2.0 (Updated Features)' : 'Status: Active / Public'}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors font-bold text-rsu-muted hover:text-rsu-navy dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-sm leading-relaxed no-scrollbar text-neutral-700 dark:text-neutral-300">
          {isTerms ? (
            /* TERMS OF SERVICE CONTENT */
            <>
              <p className="italic text-neutral-800 dark:text-neutral-200">
                Welcome to the <strong>Rivers State University (RSU) Campus Map & Timetable System</strong> (referred to as "the System," "the Application," or "the Service"). By accessing, installing, or interacting with this digital mapping, schedule, and synchronization utility, you agree to comply with and be bound by the following Terms of Service ("Terms"). If you do not agree to these terms, please do not use the application.
              </p>

              {/* Service Integration Info Box */}
              <div className="p-4 bg-rsu-navy/5 border border-rsu-navy/10 rounded-2xl space-y-1">
                <h4 className="font-bold text-rsu-navy dark:text-rsu-green text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark size={14} />
                  Important Service Integration Note
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  While basic campus layout navigation and spatial mapping remain accessible anonymously, accessing personalized institutional lecture timetables and using the automated Google Calendar synchronization feature requires users to securely authenticate via their personal Gmail accounts.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">1.</span> Scope of Service
                </h3>
                <p>
                  The Application provides users with an interactive spatial map of the Rivers State University campus layout, utilizing customized geolocations, official building footprints, and localized student landmarks/aliases (e.g., "Back of Senate"). Additionally, the System includes an advanced scheduling module that aggregates lecture timetable workflows and allows authenticated users to synchronize these schedules directly into their personal Google Calendars.
                </p>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">2.</span> Authentication and Account Integration
                </h3>
                <p>
                  To access the timetable features and activate calendar export synchronization, you must sign in securely using a valid Google (Gmail) account via standard secure OAuth channels.
                </p>
                <ul className="space-y-2.5 pl-4 border-l-2 border-rsu-orange/20 mt-2 list-none text-xs">
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">Credential Security:</strong>
                    The Application integrates directly with Google OAuth services. We do not view, harvest, or store your Google account password. Authentication is securely managed by Google.
                  </li>
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">Authorized Access:</strong>
                    You are responsible for maintaining the confidentiality of your active device sessions and Google credentials. You agree that you are solely responsible for all actions or calendar sync updates initiated through your account session.
                  </li>
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">Data Purpose:</strong>
                    Your Gmail identity is verified solely to provide authorization to sync your respective faculty or departmental lectures into your Google Calendar. This process operates without persistent user profiling or unauthorized data sharing.
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">3.</span> Permitted Use & Structural Limitations
                </h3>
                <p>
                  Users are granted a non-exclusive, non-transferable, revocable license to utilize the system for personal academic preparation, navigation assistance, and schedule planning. You explicitly agree not to:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>Use automated scripts, bots, or scraping tools to harvest database assets, map coordinates, or compiled department schedules.</li>
                  <li>Interfere with, manipulate, or degrade the performance of the synchronization gateways linking the Application to Google Calendar infrastructures.</li>
                  <li>Exploit or modify the backend API pathways used to serve map layers, localized landmarks, or dynamic timetable datasets.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">4.</span> Data Accuracy, Sync Deficiencies & Disclaimer
                </h3>
                <p>
                  We make every reasonable effort to keep campus landmark markers, route paths, and official lecture timetables accurate according to the latest administrative updates at Rivers State University. However, please note the following limitations:
                </p>
                <ul className="space-y-2.5 pl-4 border-l-2 border-rsu-green/20 list-none text-xs">
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">As-Is Framework:</strong>
                    The maps, spatial layouts, dynamic timetables, and synchronization utilities are provided "as is" and "as available."
                  </li>
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">Calendar Discrepancies:</strong>
                    Lecture venues, class timelines, or invigilation dates can shift rapidly due to campus operational changes. The System is an informational assistance tool; official departmental and faculty notice boards remain the ultimate authority for academic requirements.
                  </li>
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">Limitation of Liability:</strong>
                    The development team and associated campus contributors shall not be held liable for any missed lectures, calendar scheduling conflicts, sync delays, or mapping discrepancies that result in personal or academic inconveniences.
                  </li>
                </ul>
              </div>

              {/* Section 5 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">5.</span> Technical Infrastructure & Connectivity Costs
                </h3>
                <p>
                  To parse updated master timetable schemas, load localized spatial maps, and broadcast events to your personal Google Calendar, your device requires an active connection to the internet. You acknowledge that all data expenses, cellular provider billing, or network data usage charges incurred while using this system are entirely your responsibility.
                </p>
              </div>

              {/* Section 6 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">6.</span> Revisions to the Terms
                </h3>
                <p>
                  The operational framework of the system may iterate over time as new features are added or calendar sync functionalities expand. When updates occur, the revised Terms will be posted within this interface along with an updated "Last Updated" date. Your continued interaction with the application constitutes formal acceptance of the modified terms.
                </p>
              </div>

              {/* Section 7 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">7.</span> Governing Law
                </h3>
                <p>
                  These terms and any administrative issues arising from the usage of this digital campus utility shall be interpreted under the rules and regulations governing student conduct at Rivers State University and the legal frameworks of the Federal Republic of Nigeria.
                </p>
              </div>

              {/* Footer text */}
              <div className="pt-6 border-t border-rsu-border/20 text-center text-xs text-rsu-muted font-bold">
                Rivers State University Campus Map & Timetable Project — Empowering campus mobility with modern design, reliable calendar sync, and absolute transparency.
              </div>
            </>
          ) : (
            /* PRIVACY POLICY CONTENT */
            <>
              <p className="italic text-neutral-800 dark:text-neutral-200">
                This Privacy Policy describes how the <strong>Rivers State University (RSU) Campus Map & Timetable System</strong> (referred to as "the System," "the Application," "we," "us," or "our") handles user data. We are fully committed to protecting your privacy and providing a secure, transparent utility for navigating the Rivers State University campus and accessing lecture schedules.
              </p>

              {/* Privacy Guarantee Info Box */}
              <div className="p-4 bg-rsu-orange/5 border border-rsu-orange/10 rounded-2xl space-y-1">
                <h4 className="font-bold text-rsu-navy dark:text-rsu-green text-xs uppercase tracking-wider flex items-center gap-1.5_ mr-1">
                  <EyeOff size={14} className="text-rsu-orange" />
                  Core Privacy Guarantee
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  The RSU Campus Map & Timetable System is built on a "Privacy by Design" architecture. We do not collect, capture, process, upload, or store any personal data or personal identifier from our users. Your usage of the application is completely anonymous.
                </p>
              </div>

              {/* Section 1 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">1.</span> Information We Do Not Collect
                </h3>
                <p>
                  Unlike services that track user profiles, this System explicitly operates without requesting or processing personal data. We do not collect:
                </p>
                <ul className="space-y-2.5 pl-4 border-l-2 border-rsu-orange/20 list-none text-xs">
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">Personal Identifiers:</strong>
                    We do not collect names, email addresses, phone numbers, student registration numbers, department information, or faculty details.
                  </li>
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">Account Credentials:</strong>
                    There is no registration or sign-in mechanism required to use the system. You do not create a profile, password, or account.
                  </li>
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">Persistent Device Tracking:</strong>
                    We do not harvest unique hardware identifiers such as IMEI numbers, MAC addresses, Android IDs, or Advertising IDs.
                  </li>
                  <li>
                    <strong className="text-neutral-800 dark:text-neutral-200 block">Server-Side User History:</strong>
                    Your search queries (e.g., search strings for localized landmarks or student aliases like "Back of Senate") and timetable lookups are processed strictly on your device or treated as transient, un-linked requests. They are never tied to an individual or stored in a persistent database.
                  </li>
                </ul>
              </div>

              {/* Section 2 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">2.</span> Real-Time Location Data Handling
                </h3>
                <p>
                  To provide real-time campus navigation, route visualization, and localized landmark orientation, the Application utilizes your device’s Global Positioning System (GPS) or location services.
                </p>
                <ul className="space-y-2 pl-4 list-disc text-xs">
                  <li>
                    <strong>On-Device Processing:</strong> Your precise geographic coordinates are processed locally on your device to display your position relative to the campus map.
                  </li>
                  <li>
                    <strong>No Location Logging:</strong> This location data is utilized strictly in real-time. We do not transmit, log, cache, or store your historical coordinates or movement paths on any external server. Once you close the application, all real-time positioning information is immediately flushed from the active memory.
                  </li>
                </ul>
              </div>

              {/* Section 3 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">3.</span> Maps and Third-Party API Integration
                </h3>
                <p>
                  The Application utilizes robust third-party mapping frameworks (such as Mapbox or standard open-source geospatial tools) to render the base map tiles of the Rivers State University campus.
                </p>
                <ul className="space-y-2 pl-4 list-disc text-xs">
                  <li>When rendering map layers, your device communicates directly with these mapping infrastructure providers to load standard map assets.</li>
                  <li>Any technical data automatically transmitted to these providers (such as IP addresses required to fetch web resources) is governed independently by their respective, enterprise-grade privacy policies. No identifying personal student records are ever attached to these structural requests.</li>
                </ul>
              </div>

              {/* Section 4 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">4.</span> Data Storage and Local Caching
                </h3>
                <p>
                  To optimize performance, reduce internet data consumption, and ensure fast response times when searching for local student aliases, landmarks, and faculties, certain static application assets—such as the university timetable layouts and localized campus landmarks—are cached directly on your device’s local storage.
                </p>
                <ul className="space-y-2 pl-4 list-disc text-xs">
                  <li>This data consists strictly of static public information (schedules and geographic landmarks) and contains no user-specific metrics.</li>
                  <li>You can easily clear this localized application cache at any time through your operating system's application settings.</li>
                </ul>
              </div>

              {/* Section 5 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">5.</span> Security
                </h3>
                <p>
                  Because our System does not collect, manage, or host any personal user files or database repositories, the risk of traditional personal data breaches or credential leaks is entirely mitigated. We protect the integrity of the application platform by utilizing secure transmission protocols (such as HTTPS) for fetching updated university schedules or public landmark coordinates.
                </p>
              </div>

              {/* Section 6 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">6.</span> Changes to This Privacy Policy
                </h3>
                <p>
                  We may periodically update this Privacy Policy to reflect changes in the application’s functionality or relevant institutional frameworks. Any updates will be accompanied by a revised "Effective Date" at the top of this document. Since the system does not use or store your contact information, we encourage you to review this page within the application settings dynamically to stay informed of our data-handling practices.
                </p>
              </div>

              {/* Section 7 */}
              <div className="space-y-2">
                <h3 className="font-bold font-display text-base text-rsu-navy dark:text-white flex items-center gap-2">
                  <span className="text-rsu-orange">7.</span> Contact and Feedback
                </h3>
                <p>
                  If you have any questions, feedback, or technical inquiries regarding this Privacy Policy or the operational mechanics of the application, please contact the development team through the designated developer channel or repository provided in the application interface.
                </p>
              </div>

              {/* Footer text */}
              <div className="pt-6 border-t border-rsu-border/20 text-center text-xs text-rsu-muted font-bold">
                Rivers State University Campus Map & Timetable Project — Developed for a seamless, private campus navigation experience.
              </div>
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 dark:bg-neutral-900/50 border-t border-rsu-border flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-rsu-navy hover:bg-rsu-navy/90 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
          >
            Acknowledge & Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
