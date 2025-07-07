import Image from "next/image";

export default function FooterSection() {
  return (
    <footer className="bg-white pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top block */}
        <div className="gap-8 sm:flex-row sm:gap-12">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Image src="/8eh.png" alt="8EH Logo" width={96} height={96} />
          </div>

          {/* Address & Contact */}
          <div className="space-y-6 font-body text-sm text-gray-700">
            <div>
              <h3 className="font-semibold mb-1 text-gray-900">Address:</h3>
              <p>Jl. Ganesha 10, Bandung</p>
            </div>

            <div>
              <h3 className="font-semibold mb-1 text-gray-900">Contact:</h3>
              <p>info@8ehradioitb.com</p>
            </div>

            {/* Social media */}
            <div className="flex items-center space-x-4 pt-2">
              <a
                href="https://instagram.com/8ehradioitb"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70 focus:outline-none focus:opacity-70"
                aria-label="Instagram"
              >
                <Image
                  src="/Instagram.svg"
                  alt="Instagram"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </a>
              <a
                href="https://x.com/8ehradio_"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70 focus:outline-none focus:opacity-70"
                aria-label="X"
              >
                <Image
                  src="/X.svg"
                  alt="X"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </a>
              <a
                href="https://www.linkedin.com/company/8eh-radio-itb/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70 focus:outline-none focus:opacity-70"
                aria-label="LinkedIn"
              >
                <Image
                  src="/LinkedIn.svg"
                  alt="Linkedin"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </a>
              <a
                href="https://youtube.com/@8ehradioitb"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-opacity hover:opacity-70 focus:outline-none focus:opacity-70"
                aria-label="Youtube"
              >
                <Image
                  src="/Youtube.svg"
                  alt="Youtube"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-10 border-gray-200" />

        {/* Bottom copyright */}
        <p className="text-center font-body text-sm text-gray-600 pb-8">
          © 2025 Technic 8EH Radio ITB. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
