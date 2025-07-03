import { X, FileText, Scale, AlertTriangle, CheckCircle, Ban, Calendar } from 'lucide-react';

interface TermsOfServiceProps {
  onClose: () => void;
}

const TermsOfService = ({ onClose }: TermsOfServiceProps) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-700 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Terms of Service</h2>
                <p className="text-green-100">Rules and guidelines for using our service</p>
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
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-8">
              <div className="flex items-center space-x-2 text-green-700">
                <Calendar className="w-5 h-5" />
                <span className="font-medium">Last updated: July 2, 2025</span>
              </div>
            </div>

            {/* Introduction */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Scale className="w-5 h-5 mr-2 text-green-600" />
                Agreement to Terms
              </h3>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using Short Clip Generator ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            {/* Service Description */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Service Description</h3>
              <div className="bg-blue-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  Short Clip Generator is an AI-powered video processing service that allows users to:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Upload video content for automated clip generation</li>
                  <li>• Generate short-form clips from longer videos</li>
                  <li>• Customize clip parameters (duration, aspect ratio, etc.)</li>
                  <li>• Download processed video clips</li>
                  <li>• Manage account settings and preferences</li>
                </ul>
              </div>
            </section>

            {/* User Responsibilities */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                User Responsibilities
              </h3>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Account Security</h4>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Maintain the confidentiality of your account credentials</li>
                    <li>• Notify us immediately of any unauthorized access</li>
                    <li>• Use strong passwords and enable two-factor authentication</li>
                    <li>• Accept responsibility for all activities under your account</li>
                  </ul>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Content Guidelines</h4>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Upload only content you own or have permission to use</li>
                    <li>• Ensure content complies with applicable laws and regulations</li>
                    <li>• Respect intellectual property rights of others</li>
                    <li>• Do not upload harmful, illegal, or offensive content</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Prohibited Uses */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Ban className="w-5 h-5 mr-2 text-red-600" />
                Prohibited Uses
              </h3>
              
              <div className="bg-red-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">You may not use our service for:</p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Uploading copyrighted content without permission</li>
                  <li>• Creating content that promotes violence, hate, or discrimination</li>
                  <li>• Generating deepfakes or misleading content</li>
                  <li>• Attempting to circumvent usage limits or security measures</li>
                  <li>• Reselling or redistributing our service without authorization</li>
                  <li>• Using automated tools to abuse the service</li>
                  <li>• Any illegal activities or content that violates applicable laws</li>
                </ul>
              </div>
            </section>

            {/* Payment and Credits */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Payment and Credits</h3>
              <div className="bg-amber-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  Our service operates on a credit-based system:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Credits are required to process video content</li>
                  <li>• Credits are consumed based on video length and processing complexity</li>
                  <li>• Unused credits do not expire but are non-refundable</li>
                  <li>• Payment processing is handled by secure third-party providers</li>
                  <li>• Refunds are subject to our refund policy</li>
                </ul>
              </div>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Intellectual Property</h3>
              <div className="space-y-4">
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Your Content</h4>
                  <p className="text-gray-700">
                    You retain ownership of all content you upload. By using our service, you grant us a limited license to process your content for the purpose of providing our services.
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Our Platform</h4>
                  <p className="text-gray-700">
                    The Service, including its design, functionality, and underlying technology, is owned by us and protected by intellectual property laws.
                  </p>
                </div>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                Limitation of Liability
              </h3>
              <div className="bg-orange-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  To the maximum extent permitted by law:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• We provide the service "as is" without warranties</li>
                  <li>• We are not liable for any indirect, incidental, or consequential damages</li>
                  <li>• Our total liability is limited to the amount paid by you in the past 12 months</li>
                  <li>• We do not guarantee uninterrupted or error-free service</li>
                  <li>• Users are responsible for backing up their content</li>
                </ul>
              </div>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Termination</h3>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users of the Service, us, or third parties, or for any other reason.
              </p>
              <p className="text-gray-700">
                You may terminate your account at any time by contacting our support team. Upon termination, your right to use the Service will cease immediately.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Changes to Terms</h3>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the Service. Your continued use of the Service after such modifications constitutes acceptance of the updated terms.
              </p>
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="bg-gray-50 rounded-xl p-6">
                <p className="text-gray-700 mb-4">
                  For questions about these Terms of Service, please contact us:
                </p>
                <ul className="text-gray-700 space-y-2">
                  <li>• Email: legal@shortclipgenerator.com</li>
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
              className="px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
