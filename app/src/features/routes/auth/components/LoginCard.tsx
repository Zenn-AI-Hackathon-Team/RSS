// login.tsx
"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface LoginCardProps {
  onSuccess?: (data: { email: string }) => void;
}

const LoginCard: React.FC<LoginCardProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // バリデーション
    if (!email || !password) {
      setError("メールアドレスとパスワードを入力してください");
      return;
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("有効なメールアドレスを入力してください");
      return;
    }

    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      // メール認証を必須にするなら:
      if (!cred.user.emailVerified) {
        setSuccess(false);
        setError("メール認証が未完了です。受信トレイをご確認ください。");
        return;
      }

      setSuccess(true);
      onSuccess?.({ email });

      // ここで router.push("/dashboard") など
    } catch (err: any) {
      const code = err?.code as string;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password")
        setError("メールアドレスまたはパスワードが正しくありません");
      else if (code === "auth/user-not-found")
        setError("このメールアドレスのアカウントは存在しません");
      else setError("ログインに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            ログイン
          </CardTitle>
          <CardDescription className="text-center">
            アカウントにログインしてください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">パスワード</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50">
                <AlertDescription className="text-green-700">
                  ログインに成功しました！
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ログイン中...
                </>
              ) : (
                "ログイン"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <div className="text-sm text-gray-600 text-center">
            <Link
              href="/forgot-password"
              className="text-blue-600 hover:underline"
            >
              パスワードをお忘れですか？
            </Link>
          </div>

          <div className="text-sm text-gray-600 text-center">
            アカウントをお持ちでない方は
            <Link
              href="/register"
              className="text-blue-600 hover:underline ml-1 font-medium"
            >
              新規登録
            </Link>
          </div>

          <div className="text-xs text-gray-500 text-center mt-2">
            デモ用: メール "demo@example.com" / パスワード "password"
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginCard;
