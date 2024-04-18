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
          Terms and Conditions for Void
        </h1>

        <pre
          className="leading-relaxed whitespace-pre-wrap"
          style={{ fontFamily: 'sans-serif' }}
        >
          {`Last Updated: 2024-04-10

These Terms of Service ("Terms") govern your use of our website located at https://voidpm.io (the "Site") and the services provided therein (collectively, the "Service"), operated by Void ("we", "us", or "our").

By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the Terms, then you may not access the Service.

1. Use of Service

You must be at least 13 years old to use the Service. By using the Service, you represent and warrant that you are at least 13 years old.

2. User Data

By using the Service, you agree to our Privacy Policy, available at https://voidpm.io/privacy, which describes how we collect, use, and disclose your information.

3. Payment Information

When making payments through the Service, you agree to provide accurate and complete payment information. You authorize us to charge your payment method for any fees or charges incurred through your use of the Service.

4. Non-Personal Data Collection

We may use web cookies and similar technologies to collect non-personal information about your use of the Service. This information helps us improve our Service and provide a better user experience.

5. Governing Law

These Terms shall be governed by and construed in accordance with the laws of Hong Kong SAR China, without regard to its conflict of law provisions.

6. Changes to Terms

We reserve the right to update or modify these Terms at any time. If we make any material changes, we will notify you by email or by posting a notice on the Site prior to the change becoming effective. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.

7. Contact Us

If you have any questions about these Terms, please contact us at mike@wu.studio.

Thank you for using Void PM!

`}
        </pre>
      </div>
    </main>
  )
}
