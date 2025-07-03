import React, { useState } from 'react';
import Modal from './Modal';
import { FileText, Shield, Scale, Info } from 'lucide-react';

interface LegalModalsProps {
  isTermsOpen: boolean;
  isPrivacyOpen: boolean;
  isLegalOpen: boolean;
  onCloseTerms: () => void;
  onClosePrivacy: () => void;
  onCloseLegal: () => void;
}

export function TermsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Terms of Service" maxWidth="2xl">
      <div className="prose prose-sm max-w-none">
        <div className="flex items-center space-x-2 text-blue-600 mb-4">
          <Scale className="w-5 h-5" />
          <span className="font-medium">Last updated: December 2024</span>
        </div>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h3>
          <p className="text-gray-700 leading-relaxed">
            By accessing and using Upload You Clips ("the Service"), you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">2. Use License</h3>
          <p className="text-gray-700 leading-relaxed mb-3">
            Permission is granted to temporarily download one copy of the materials on Upload You Clips for personal, 
            non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>modify or copy the materials</li>
            <li>use the materials for any commercial purpose or for any public display</li>
            <li>attempt to reverse engineer any software contained on the website</li>
            <li>remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Content and Upload Restrictions</h3>
          <p className="text-gray-700 leading-relaxed mb-3">
            Users are responsible for the content they upload. You agree not to upload content that:
          </p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Violates any laws or regulations</li>
            <li>Infringes on intellectual property rights</li>
            <li>Contains malicious software or code</li>
            <li>Is harmful, threatening, or objectionable</li>
            <li>Violates privacy rights of others</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Service Availability</h3>
          <p className="text-gray-700 leading-relaxed">
            We strive to provide continuous service availability but do not guarantee uninterrupted access. 
            The service may be temporarily unavailable due to maintenance, updates, or technical issues.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Disclaimer</h3>
          <p className="text-gray-700 leading-relaxed">
            The materials on Upload You Clips are provided on an 'as is' basis. Upload You Clips makes no warranties, 
            expressed or implied, and hereby disclaims and negates all other warranties including without limitation, 
            implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement 
            of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Limitations</h3>
          <p className="text-gray-700 leading-relaxed">
            In no event shall Upload You Clips or its suppliers be liable for any damages (including, without limitation, 
            damages for loss of data or profit, or due to business interruption) arising out of the use or inability to 
            use the materials on Upload You Clips, even if Upload You Clips or its authorized representative has been 
            notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Contact Information</h3>
          <p className="text-gray-700 leading-relaxed">
            If you have any questions about these Terms of Service, please contact us at support@uploadyouclips.com
          </p>
        </section>
      </div>
    </Modal>
  );
}

export function PrivacyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Privacy Policy" maxWidth="2xl">
      <div className="prose prose-sm max-w-none">
        <div className="flex items-center space-x-2 text-green-600 mb-4">
          <Shield className="w-5 h-5" />
          <span className="font-medium">Last updated: December 2024</span>
        </div>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">1. Information We Collect</h3>
          <p className="text-gray-700 leading-relaxed mb-3">We collect information you provide directly to us, such as:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Account information (email, username, password)</li>
            <li>Profile information (name, preferences)</li>
            <li>Video content you upload</li>
            <li>Usage data and analytics</li>
            <li>Communication records</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">2. How We Use Your Information</h3>
          <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Provide and maintain our service</li>
            <li>Process your video uploads and generate clips</li>
            <li>Communicate with you about the service</li>
            <li>Improve our service and develop new features</li>
            <li>Ensure security and prevent abuse</li>
          </ul>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">3. Information Sharing</h3>
          <p className="text-gray-700 leading-relaxed">
            We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, 
            except as described in this policy. We may share information with trusted service providers who assist us in 
            operating our service, conducting our business, or serving our users.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">4. Data Security</h3>
          <p className="text-gray-700 leading-relaxed">
            We implement appropriate security measures to protect your personal information against unauthorized access, 
            alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic 
            storage is 100% secure.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">5. Data Retention</h3>
          <p className="text-gray-700 leading-relaxed">
            We retain your information for as long as necessary to provide our services. Video content is automatically 
            deleted after 30 days unless you choose to download it. Account information is retained until you delete your account.
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">6. Your Rights</h3>
          <p className="text-gray-700 leading-relaxed mb-3">You have the right to:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Access your personal information</li>
            <li>Correct inaccurate information</li>
            <li>Delete your account and data</li>
            <li>Export your data</li>
            <li>Opt-out of communications</li>
          </ul>
        </section>

        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">7. Contact Us</h3>
          <p className="text-gray-700 leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at privacy@uploadyouclips.com
          </p>
        </section>
      </div>
    </Modal>
  );
}

export function LegalModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dmca' | 'copyright'>('overview');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Legal Information" maxWidth="2xl">
      <div className="prose prose-sm max-w-none">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Info className="w-4 h-4 inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('dmca')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'dmca'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4 inline mr-2" />
            DMCA
          </button>
          <button
            onClick={() => setActiveTab('copyright')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'copyright'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Copyright
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal Overview</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Upload You Clips is committed to operating within all applicable laws and regulations. 
              This section provides important legal information about our service.
            </p>
            
            <h4 className="font-medium text-gray-900 mb-2">Key Points:</h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li>Users retain ownership of their uploaded content</li>
              <li>We respect intellectual property rights</li>
              <li>DMCA-compliant takedown procedures</li>
              <li>Service provided "as-is" with limitations</li>
              <li>Disputes resolved through arbitration</li>
            </ul>

            <h4 className="font-medium text-gray-900 mb-2">Compliance:</h4>
            <p className="text-gray-700 leading-relaxed">
              Our service complies with GDPR, CCPA, and other applicable privacy regulations. 
              We regularly review and update our practices to ensure continued compliance.
            </p>
          </div>
        )}

        {activeTab === 'dmca' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">DMCA Policy</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Upload You Clips respects the intellectual property rights of others and expects our users to do the same. 
              In accordance with the Digital Millennium Copyright Act (DMCA), we will respond to legitimate copyright 
              infringement claims.
            </p>

            <h4 className="font-medium text-gray-900 mb-2">Filing a DMCA Notice:</h4>
            <p className="text-gray-700 leading-relaxed mb-3">
              If you believe your copyrighted work has been infringed, please provide our designated agent with the following information:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li>Identification of the copyrighted work</li>
              <li>Identification of the infringing material</li>
              <li>Your contact information</li>
              <li>A statement of good faith belief</li>
              <li>A statement under penalty of perjury</li>
              <li>Your physical or electronic signature</li>
            </ul>

            <h4 className="font-medium text-gray-900 mb-2">Contact Information:</h4>
            <p className="text-gray-700 leading-relaxed">
              DMCA Agent: legal@uploadyouclips.com<br />
              Address: 123 Legal St, Suite 100, City, State 12345
            </p>
          </div>
        )}

        {activeTab === 'copyright' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Copyright Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              Understanding copyright is essential when using our video processing service. 
              Here's what you need to know about copyright and our service.
            </p>

            <h4 className="font-medium text-gray-900 mb-2">User Responsibilities:</h4>
            <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
              <li>Only upload content you own or have permission to use</li>
              <li>Respect third-party intellectual property rights</li>
              <li>Understand fair use limitations</li>
              <li>Obtain necessary licenses for copyrighted material</li>
            </ul>

            <h4 className="font-medium text-gray-900 mb-2">Copyright Ownership:</h4>
            <p className="text-gray-700 leading-relaxed mb-4">
              You retain all rights to your original content. By using our service, you grant us a limited license 
              to process your videos for the purpose of creating clips, but we do not claim ownership of your content.
            </p>

            <h4 className="font-medium text-gray-900 mb-2">Content Protection:</h4>
            <p className="text-gray-700 leading-relaxed">
              We implement measures to protect against unauthorized use of copyrighted content, including automated 
              detection systems and user reporting mechanisms.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function LegalModals(props: LegalModalsProps) {
  return (
    <>
      <TermsModal isOpen={props.isTermsOpen} onClose={props.onCloseTerms} />
      <PrivacyModal isOpen={props.isPrivacyOpen} onClose={props.onClosePrivacy} />
      <LegalModal isOpen={props.isLegalOpen} onClose={props.onCloseLegal} />
    </>
  );
}
