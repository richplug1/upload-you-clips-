import { X, Shield, Eye, Lock, Users, Globe, Mail, Calendar } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const PrivacyPolicy = ({ onClose }: PrivacyPolicyProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Privacy Policy</h2>
                <p className="text-blue-100">How we protect and handle your data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="prose prose-gray max-w-none">
            
            {/* Last Updated */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-8">
              <div className="flex items-center space-x-2 text-blue-700">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Last updated: July 2, 2025</span>
              </div>
            </div>

            {/* Introduction */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Eye className="w-5 h-5 mr-2 text-blue-600" />
                Introduction
              </h3>
              <p className="text-gray-700 leading-relaxed">
                At Short Clip Generator, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our video clip generation service.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-green-600" />
                Information We Collect
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Personal Information</h4>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Email address and account credentials</li>
                    <li>• Username and profile information</li>
                    <li>• Payment information (processed securely through third-party providers)</li>
                    <li>• Communication preferences</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Usage Data</h4>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Video files uploaded for processing</li>
                    <li>• Generated clips and associated metadata</li>
                    <li>• Usage statistics and performance metrics</li>
                    <li>• Device information and browser type</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Technical Information</h4>
                  <ul className="text-gray-700 space-y-1">
                    <li>• IP address and location data</li>
                    <li>• Cookies and tracking technologies</li>
                    <li>• Log files and error reports</li>
                    <li>• Feature usage and interaction data</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Globe className="w-5 h-5 mr-2 text-purple-600" />
                How We Use Your Information
              </h3>
              
              <div className="bg-purple-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">We use your information to:</p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Provide and maintain our video processing services</li>
                  <li>• Process your video uploads and generate clips</li>
                  <li>• Manage your account and billing</li>
                  <li>• Improve our AI algorithms and service quality</li>
                  <li>• Send important updates and notifications</li>
                  <li>• Provide customer support and technical assistance</li>
                  <li>• Comply with legal obligations and prevent fraud</li>
                </ul>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-red-600" />
                Data Security
              </h3>
              
              <div className="bg-red-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">We implement industry-standard security measures:</p>
                <ul className="text-gray-700 space-y-2">
                  <li>• End-to-end encryption for all data transfers</li>
                  <li>• Secure cloud storage with regular backups</li>
                  <li>• Access controls and authentication protocols</li>
                  <li>• Regular security audits and vulnerability assessments</li>
                  <li>• Automatic data deletion after processing (unless saved by user)</li>
                </ul>
              </div>
            </section>

            {/* Data Sharing */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Sharing and Disclosure</h3>
              <p className="text-gray-700 mb-4">
                We do not sell your personal information. We may share your data only in the following circumstances:
              </p>
              <ul className="text-gray-700 space-y-2">
                <li>• With your explicit consent</li>
                <li>• With trusted service providers who assist in our operations</li>
                <li>• To comply with legal requirements or court orders</li>
                <li>• To protect our rights, property, or safety</li>
                <li>• In case of business transfer or merger</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h3>
              <div className="bg-green-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">You have the right to:</p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Access your personal data</li>
                  <li>• Correct inaccurate information</li>
                  <li>• Delete your account and data</li>
                  <li>• Export your data</li>
                  <li>• Opt-out of marketing communications</li>
                  <li>• Lodge a complaint with supervisory authorities</li>
                </ul>
              </div>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                Contact Us
              </h3>
              <div className="bg-blue-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Email: privacy@shortclipgenerator.com</li>
                  <li>• Address: 123 Tech Street, Digital City, DC 12345</li>
                  <li>• Phone: +1 (555) 123-4567</li>
                </ul>
              </div>
            </section>

          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-8 py-4 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
