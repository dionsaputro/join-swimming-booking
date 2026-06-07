"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Email atau password salah");
      setIsLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F0F4FF] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-8"
      >
        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex w-20 h-20 rounded-2xl items-center justify-center mb-4">
            <Image src="/logo.png" alt="Join Swimming" width={80} height={80} className="rounded-2xl" />
          </div>
          <h1 className="font-display text-3xl text-gray-900">Join Swimming</h1>
          <p className="text-sm text-gray-500 font-medium mt-2">Masuk ke dashboard admin</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="admin@joinswimming.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && (
              <p className="text-sm text-rose-500 font-medium">{error}</p>
            )}
          </div>
          <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
            Masuk
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
