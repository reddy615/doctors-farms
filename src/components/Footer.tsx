import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="text-xl font-semibold text-white">Doctors Farms</div>
          <p className="max-w-sm text-sm text-slate-300">
            A nature-first resort built for relaxation, organic living, and simple wellness.
          </p>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Doctors Farms Resort. All rights reserved.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
          <div>
            <div className="mb-2 text-sm font-semibold text-white">Explore</div>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>
                <Link to="/" className="hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/rooms" className="hover:text-white">
                  Rooms
                </Link>
              </li>
              <li>
                <Link to="/activities" className="hover:text-white">
                  Activities
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold text-white">Support</div>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>
                <Link to="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link to="/dining" className="hover:text-white">
                  Dining
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="mb-2 text-sm font-semibold text-white">Contact</div>
            <p className="text-sm text-slate-300">Phone: +91 99555 75969</p>
            <p className="text-sm text-slate-300">
              <a
                href="https://wa.me/919955575969?text=Hello%20Doctors%20Farms"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-400"
              >
                WhatsApp: +91 99555 75969
              </a>
            </p>
            <p className="text-sm text-slate-300">Email: doctorsfarms686@gmail.com</p>
            <p className="text-sm text-slate-300">Location: Near Greenfield Valley, India</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
