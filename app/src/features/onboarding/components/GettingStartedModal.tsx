"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
};

const GettingStartedModal: React.FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState(0); // 0..2

  // モーダルが開くたびに 1 ページ目に戻す
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const next = () => setStep((s) => Math.min(2, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex flex-col w-[640px] max-w-[92vw] h-[560px]">
        <DialogHeader>
          <DialogTitle>ようこそ！はじめに 🚀</DialogTitle>
          <DialogDescription>
            かんたん3ステップでスタートしましょう。あとからも左下のヘルプで見返せます 💡
          </DialogDescription>
        </DialogHeader>

        {/* step indicator */}
        <div className="flex justify-center items-center gap-2 pb-2">
          {[0,1,2].map((i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${step===i? "bg-indigo-600" : "bg-slate-300"}`} />
          ))}
        </div>

        <div className="flex-1 space-y-6 py-2 overflow-auto">
          {step === 0 && (
            <section>
              <h3 className="mb-2 font-semibold">1. カテゴリを作成しよう ✨</h3>
              <p className="mb-2 text-slate-600 text-sm">
                トップの「カテゴリ」から「カテゴリを追加」をタップして、整理用フォルダを作成しましょう 📁
              </p>
              {/** biome-ignore lint/performance/noImgElement: <explanation> */}
              <img
                src="/help/create-category.png"
                alt="カテゴリ作成ボタンの例"
                className="border rounded w-full"
              />
            </section>
          )}

          {step === 1 && (
            <section>
              <h3 className="mb-2 font-semibold">2. 右下のボタンからリンク追加 ➕🔗</h3>
              <p className="mb-2 text-slate-600 text-sm">
                右下の「追加」ボタンからURLを保存！あとでカテゴリに移動もできます 👌
              </p>
              {/** biome-ignore lint/performance/noImgElement: <explanation> */}
              <img
                src="/help/add-link.png"
                alt="右下のリンク追加ボタンの例"
                className="border rounded w-full"
              />
            </section>
          )}

          {step === 2 && (
            <section>
              <h3 className="mb-2 font-semibold">3. ヘルプからいつでも見返せる 🆘</h3>
              <p className="mb-2 text-slate-600 text-sm">
                画面左下の「ヘルプ」ボタンから、このガイドをいつでも開けます 🔁
              </p>
              <img
                src="/help/help-button.png"
                alt="左下のヘルプボタンの例"
                className="border rounded w-full"
              />
            </section>
          )}
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between items-center mt-auto w-full">
          <div className="space-x-2">
            <Button
              variant="outline"
              onClick={prev}
              disabled={step === 0}
              className="bg-white hover:bg-white text-slate-700"
            >
              戻る
            </Button>
          </div>
          <div className="space-x-2">
            {step < 2 ? (
              <Button onClick={next}>次へ</Button>
            ) : (
              <Button onClick={onClose}>はじめる</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GettingStartedModal;
