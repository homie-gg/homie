import Link from 'next/link'

export const metadata = {
  title: `Privacy Policy | Void`,
  canonicalUrlRelative: '/privacy',
}

export default function PrivacyPolicy() {
  return (
    <main className="max-w-xl mx-auto">
      <div className="p-5">
        <Link href="/" className="btn btn-ghost">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M15 10a.75.75 0 01-.75.75H7.612l2.158 1.96a.75.75 0 11-1.04 1.08l-3.5-3.25a.75.75 0 010-1.08l3.5-3.25a.75.75 0 111.04 1.08L7.612 9.25h6.638A.75.75 0 0115 10z"
              clipRule="evenodd"
            />
          </svg>{' '}
          Back
        </Link>
        <h1 className="text-3xl font-extrabold pb-6">
          Privacy Policy for Void
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: 'sans-serif' }}
        >
          {`Last Updated: 2024-04-10

Thank you for choosing Void PM ("Void," "we," "us," "our"). This Privacy Policy outlines how Void collects, uses, and protects your information when you use our website (https://voidpm.io) and services.

Information We Collect

We collect the following types of information for the purposes of providing and improving our services:

Personal Information: When you sign up for Void PM, we collect your name, email address, and payment information to process orders and manage your account.

Non-Personal Information: We may use web cookies to gather non-personal information about your interactions with our website. This information helps us improve our website and services.

Purpose of Data Collection

We collect your information solely for the purpose of order processing and providing you with access to Void PM's services. Your information helps us manage your account, process payments, and communicate important updates.

Data Sharing

We do not share your personal information with any third parties. Your data is securely stored and used only for the purposes outlined in this Privacy Policy.

Children's Privacy

Void PM does not knowingly collect any personal information from children under the age of 13. Our services are intended for individuals who are at least 13 years old or older.

Updates to the Privacy Policy

We may update this Privacy Policy from time to time to reflect changes in our practices and services. We will notify you of any significant changes by sending an email to the address associated with your Void PM account.

Contact Us

If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at mike@wu.studio.

By using Void PM's website and services, you consent to the terms of this Privacy Policy.`}
        </pre>
      </div>
    </main>
  )
}
