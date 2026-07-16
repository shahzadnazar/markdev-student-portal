import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import { BrandMark } from "./brand-mark";

const highlights = [
  { title: "Structured paths", body: "Curated modules that take you from fundamentals to shipping real projects." },
  { title: "Hands-on practice", body: "Assignments and quizzes with instructor feedback on every submission." },
  { title: "Proof of skill", body: "Verified certificates and a progress record you can share anywhere." },
];

/** Split-screen guest layout: brand panel left, form column right. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen bg-surface-ice">
      {/* Brand panel */}
      <div className="bg-gradient-brand relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        {/* Soft decorative glows */}
        <div
          aria-hidden="true"
          className="absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -left-24 size-96 rounded-full bg-black/10 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <BrandMark className="bg-white/15 backdrop-blur-sm" />
          <span className="font-display text-body-lg font-bold tracking-tight">MarkDev</span>
        </div>

        <div className="relative max-w-md">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="font-display text-headline-xl"
          >
            Learn. Build. Grow.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="mt-4 text-body-lg text-white/85"
          >
            Your developer learning workspace — courses, assignments, quizzes and certificates in one
            focused place.
          </motion.p>

          <ul className="mt-10 space-y-5">
            {highlights.map((item, index) => (
              <motion.li
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                className="flex gap-3"
              >
                <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-white/70" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-body-sm text-white/70">{item.body}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <p className="relative font-mono text-label-sm text-white/60 uppercase">
          MarkDev LMS — Learn • Build • Grow
        </p>
      </div>

      {/* Form column */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <div className="w-full max-w-105">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
