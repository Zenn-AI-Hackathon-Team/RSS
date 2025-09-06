// register.tsx
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
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface RegisterCardProps {
  onSuccess?: (data: { username: string; email: string }) => void;
  redirectToLogin?: boolean;
}

const RegisterCard: React.FC<RegisterCardProps> = ({
  onSuccess,
  redirectToLogin = true,
}) => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // バリデーション
    if (!username || !email || !password || !confirmPassword) {
      setError("すべての項目を入力してください");
      return;
    }

    // ユーザー名の長さチェック
    if (username.length < 3) {
      setError("ユーザー名は3文字以上で入力してください");
      return;
    }

    // メールアドレスの簡易バリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("有効なメールアドレスを入力してください");
      return;
    }

    // パスワードの強度チェック
    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    // パスワードの一致確認
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }

    setIsLoading(true);

    try {
      // 1) Firebaseでユーザー作成
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 2) displayNameにユーザー名を反映
      await updateProfile(cred.user, { displayName: username });

      // 3) メール認証を送る（任意だが推奨）
      await sendEmailVerification(cred.user);

      setSuccess(true);

      // 任意: すぐログイン扱いになるので、メール認証が必要なら注意文を出す
      // ここで onSuccess コールバック
      onSuccess?.({ username, email });

      // リダイレクト（既存のまま）
      if (redirectToLogin) {
        setTimeout(() => router.push("/login"), 1500);
      }
    } catch (err: any) {
      // よくあるエラーを日本語に
      const code = err?.code as string;
      if (code === "auth/email-already-in-use")
        setError("このメールアドレスは既に使用されています。");
      else if (code === "auth/invalid-email")
        setError("メールアドレスの形式が正しくありません。");
      else if (code === "auth/weak-password")
        setError("パスワードが弱すぎます（6文字以上を推奨）。");
      else setError("登録に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // パスワード強度のインジケーター
  const getPasswordStrength = () => {
    if (!password) return null;
    if (password.length < 6) return "weak";
    if (password.length < 10) return "medium";
    return "strong";
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            新規登録
          </CardTitle>
          <CardDescription className="text-center">
            新しいアカウントを作成してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">ユーザー名</Label>
              <Input
                id="username"
                type="text"
                placeholder="3文字以上で入力"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                className="w-full"
                required
              />
            </div>

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
                  placeholder="6文字以上で入力"
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
              {passwordStrength && (
                <div className="flex items-center space-x-2 mt-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        passwordStrength === "weak"
                          ? "w-1/3 bg-red-500"
                          : passwordStrength === "medium"
                            ? "w-2/3 bg-yellow-500"
                            : "w-full bg-green-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs ${
                      passwordStrength === "weak"
                        ? "text-red-500"
                        : passwordStrength === "medium"
                          ? "text-yellow-600"
                          : "text-green-500"
                    }`}
                  >
                    {passwordStrength === "weak"
                      ? "弱い"
                      : passwordStrength === "medium"
                        ? "普通"
                        : "強い"}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">パスワード（確認）</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="パスワードを再入力"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password === confirmPassword && (
                <div className="flex items-center text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  パスワードが一致しています
                </div>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-500 bg-green-50">
                <AlertDescription className="text-green-700">
                  アカウントの作成に成功しました！ログイン画面に移動します...
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登録中...
                </>
              ) : (
                "アカウントを作成"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <div className="text-sm text-gray-600 text-center">
            すでにアカウントをお持ちの方は
            <Link
              href="/login"
              className="text-blue-600 hover:underline ml-1 font-medium"
            >
              ログイン
            </Link>
          </div>

          <div className="text-xs text-gray-500 text-center">
            登録することで、
            <Link href="/terms" className="text-blue-600 hover:underline">
              利用規約
            </Link>
            と
            <Link href="/privacy" className="text-blue-600 hover:underline">
              プライバシーポリシー
            </Link>
            に同意したものとみなされます
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default RegisterCard;
