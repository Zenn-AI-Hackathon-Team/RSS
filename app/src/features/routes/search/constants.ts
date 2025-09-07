export const SEARCH_CONFIG = {
	// プレースホルダーテキスト
	PLACEHOLDER: {
		DEFAULT: "検索キーワードを入力",
		FULL: "検索キーワードを入力してください",
	},

	// 空状態メッセージ
	EMPTY_STATE: {
		TITLE: "検索を開始してください",
		SUBTITLE: "キーワードを入力すると結果が表示されます",
	},

	// 結果なし状態メッセージ
	NO_RESULTS: {
		TITLE: "検索結果はありません",
		SUBTITLE: "別のキーワードで検索してみてください",
	},

	// アクセシビリティラベル
	ARIA_LABELS: {
		SEARCH_INPUT: "検索キーワード入力",
		OPEN_DIALOG: "検索ダイアログを開く",
		SELECT_RESULT: "の検索結果を選択",
	},

	// スタイリング設定
	STYLES: {
		DIALOG: {
			WIDTH: "w-[90vw]",
			MAX_WIDTH: "max-w-md",
			POSITION:
				"fixed top-4 sm:top-8 left-1/2 transform -translate-x-1/2 -translate-y-0",
		},
		CONTENT: {
			MAX_HEIGHT: "max-h-[40vh]",
			MIN_HEIGHT: "min-h-[15vh]",
		},
	},
} as const;
