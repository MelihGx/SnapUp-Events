"use strict";

const EMAIL_LANGUAGE_METADATA = {
  "en": {
    "label": "English",
    "locale": "en-US",
    "direction": "ltr"
  },
  "hi": {
    "label": "हिन्दी",
    "locale": "hi-IN",
    "direction": "ltr"
  },
  "ur": {
    "label": "اردو",
    "locale": "ur-PK",
    "direction": "rtl"
  },
  "fa": {
    "label": "فارسی",
    "locale": "fa-IR",
    "direction": "rtl"
  },
  "ja": {
    "label": "日本語",
    "locale": "ja-JP",
    "direction": "ltr"
  },
  "zh": {
    "label": "简体中文",
    "locale": "zh-CN",
    "direction": "ltr"
  },
  "ko": {
    "label": "한국어",
    "locale": "ko-KR",
    "direction": "ltr"
  },
  "pt": {
    "label": "Português (Brasil)",
    "locale": "pt-BR",
    "direction": "ltr",
    "translationCode": "pt"
  },
  "ru": {
    "label": "Русский",
    "locale": "ru-RU",
    "direction": "ltr"
  },
  "id": {
    "label": "Bahasa Indonesia",
    "locale": "id-ID",
    "direction": "ltr"
  },
  "pl": {
    "label": "Polski",
    "locale": "pl-PL",
    "direction": "ltr"
  },
  "vi": {
    "label": "Tiếng Việt",
    "locale": "vi-VN",
    "direction": "ltr"
  },
  "uk": {
    "label": "Українська",
    "locale": "uk-UA",
    "direction": "ltr"
  },
  "th": {
    "label": "ไทย",
    "locale": "th-TH",
    "direction": "ltr"
  },
  "cs": {
    "label": "Čeština",
    "locale": "cs-CZ",
    "direction": "ltr"
  },
  "he": {
    "label": "עברית",
    "locale": "he-IL",
    "direction": "rtl"
  },
  "hu": {
    "label": "Magyar",
    "locale": "hu-HU",
    "direction": "ltr"
  },
  "sv": {
    "label": "Svenska",
    "locale": "sv-SE",
    "direction": "ltr"
  },
  "bn": {
    "label": "বাংলা",
    "locale": "bn-BD",
    "direction": "ltr"
  },
  "ms": {
    "label": "Bahasa Melayu",
    "locale": "ms-MY",
    "direction": "ltr"
  },
  "fil": {
    "label": "Filipino",
    "locale": "fil-PH",
    "direction": "ltr"
  }
};

const EMAIL_COPIES = {
  "en": {
    "common": {
      "fallbackName": "there",
      "hello": "Hello {{name}},",
      "buttonFallback": "Button not working? Copy and paste this address into your browser:",
      "footerTagline": "Every guest. Every moment. One shared album.",
      "footerSecurity": "This is an automated account-security email."
    },
    "verification": {
      "subject": "Verify your email — SnapUp Events",
      "documentTitle": "Verify your SnapUp Events email",
      "preheader": "Verify your email address to start creating events on SnapUp Events.",
      "headerLabel": "Email verification",
      "eyebrow": "Welcome to SnapUp",
      "heading": "Verify your email",
      "introduction": "Confirm your email address to start creating events, sharing QR codes, and collecting every guest moment in one shared album.",
      "button": "Verify my email",
      "secureLabel": "Secure link:",
      "secureText": "This link expires in 24 hours and can only be used once. If you did not create this account, no action is required.",
      "textWelcome": "Welcome to SnapUp Events. Verify your email address to start creating and managing events.",
      "textExpires": "This verification link expires in 24 hours and can only be used once.",
      "textIgnore": "If you did not create this account, you can safely ignore this email."
    },
    "passwordReset": {
      "subject": "Reset your password — SnapUp Events",
      "documentTitle": "Reset your SnapUp Events password",
      "preheader": "Use this secure, single-use link to reset your SnapUp Events password.",
      "headerLabel": "Account security",
      "eyebrow": "Password recovery",
      "heading": "Reset your password.",
      "introduction": "We received a request to create a new password for your SnapUp Events account.",
      "button": "Create a new password",
      "secureLabel": "Secure, single-use link.",
      "secureText": "It expires in 30 minutes. If you did not request this change, your current password remains unchanged.",
      "textRequest": "We received a request to reset your SnapUp Events password.",
      "textExpires": "This reset link expires in 30 minutes and can only be used once.",
      "textIgnore": "If you did not request a password reset, you can safely ignore this email."
    }
  },
  "hi": {
    "common": {
      "fallbackName": "वहाँ",
      "hello": "नमस्ते {{name}},",
      "buttonFallback": "बटन काम नहीं कर रहा? इस पते को कॉपी करके अपने ब्राउज़र में पेस्ट करें:",
      "footerTagline": "हर मेहमान. हर क्षण। एक साझा एल्बम.",
      "footerSecurity": "यह एक स्वचालित खाता-सुरक्षा ईमेल है."
    },
    "verification": {
      "subject": "अपना ईमेल सत्यापित करें - SnapUp Events",
      "documentTitle": "अपना SnapUp Events ईमेल सत्यापित करें",
      "preheader": "SnapUp Events पर ईवेंट बनाना प्रारंभ करने के लिए अपना ईमेल पता सत्यापित करें।",
      "headerLabel": "ईमेल सत्यापन",
      "eyebrow": "SnapUp में आपका स्वागत है",
      "heading": "अपना ईमेल सत्यापित करें",
      "introduction": "ईवेंट बनाना शुरू करने, QR कोड साझा करने और प्रत्येक अतिथि क्षण को एक साझा एल्बम में एकत्रित करने के लिए अपने ईमेल पते की पुष्टि करें।",
      "button": "मेरा ईमेल सत्यापित करें",
      "secureLabel": "सुरक्षित लिंक:",
      "secureText": "यह लिंक 24 घंटे में समाप्त हो जाता है और इसका उपयोग केवल एक बार किया जा सकता है। यदि आपने यह खाता नहीं बनाया है, तो किसी कार्रवाई की आवश्यकता नहीं है।",
      "textWelcome": "SnapUp Events में आपका स्वागत है। ईवेंट बनाना और प्रबंधित करना शुरू करने के लिए अपना ईमेल पता सत्यापित करें।",
      "textExpires": "यह सत्यापन लिंक 24 घंटे में समाप्त हो जाता है और इसका उपयोग केवल एक बार किया जा सकता है।",
      "textIgnore": "यदि आपने यह खाता नहीं बनाया है, तो आप इस ईमेल को सुरक्षित रूप से अनदेखा कर सकते हैं।"
    },
    "passwordReset": {
      "subject": "अपना पासवर्ड रीसेट करें - SnapUp Events",
      "documentTitle": "अपना SnapUp Events पासवर्ड रीसेट करें",
      "preheader": "अपना SnapUp Events पासवर्ड रीसेट करने के लिए इस सुरक्षित, एकल-उपयोग लिंक का उपयोग करें।",
      "headerLabel": "खाता सुरक्षा",
      "eyebrow": "पासवर्ड पुनर्प्राप्ति",
      "heading": "अपना पासवर्ड रीसेट करें.",
      "introduction": "हमें आपके SnapUp Events खाते के लिए एक नया पासवर्ड बनाने का अनुरोध प्राप्त हुआ।",
      "button": "एक नया पासवर्ड बनाएं",
      "secureLabel": "सुरक्षित, एकल-उपयोग लिंक।",
      "secureText": "यह 30 मिनट में समाप्त हो जाता है. यदि आपने इस परिवर्तन का अनुरोध नहीं किया है, तो आपका वर्तमान पासवर्ड अपरिवर्तित रहेगा।",
      "textRequest": "हमें आपका SnapUp Events पासवर्ड रीसेट करने का अनुरोध प्राप्त हुआ।",
      "textExpires": "यह रीसेट लिंक 30 मिनट में समाप्त हो जाएगा और इसका उपयोग केवल एक बार किया जा सकता है।",
      "textIgnore": "यदि आपने पासवर्ड रीसेट का अनुरोध नहीं किया है, तो आप इस ईमेल को सुरक्षित रूप से अनदेखा कर सकते हैं।"
    }
  },
  "ur": {
    "common": {
      "fallbackName": "وہاں",
      "hello": "ہیلو {{name}}،",
      "buttonFallback": "بٹن کام نہیں کر رہا ہے؟ اس پتے کو کاپی اور اپنے براؤزر میں پیسٹ کریں:",
      "footerTagline": "ہر مہمان۔ ہر لمحہ۔ ایک مشترکہ البم۔",
      "footerSecurity": "یہ ایک خودکار اکاؤنٹ سیکیورٹی ای میل ہے۔"
    },
    "verification": {
      "subject": "اپنے ای میل کی تصدیق کریں — SnapUp Events",
      "documentTitle": "اپنے SnapUp Events ای میل کی تصدیق کریں۔",
      "preheader": "SnapUp Events پر ایونٹس بنانا شروع کرنے کے لیے اپنے ای میل ایڈریس کی تصدیق کریں۔",
      "headerLabel": "ای میل کی توثیق",
      "eyebrow": "SnapUp میں خوش آمدید",
      "heading": "اپنے ای میل کی تصدیق کریں۔",
      "introduction": "ایونٹس بنانا، QR کوڈز کا اشتراک، اور ایک مشترکہ البم میں مہمان کے ہر لمحے کو جمع کرنے کے لیے اپنے ای میل ایڈریس کی تصدیق کریں۔",
      "button": "میرے ای میل کی تصدیق کریں۔",
      "secureLabel": "محفوظ لنک:",
      "secureText": "یہ لنک 24 گھنٹے میں ختم ہو جاتا ہے اور صرف ایک بار استعمال کیا جا سکتا ہے۔ اگر آپ نے یہ اکاؤنٹ نہیں بنایا تو کسی کارروائی کی ضرورت نہیں ہے۔",
      "textWelcome": "SnapUp Events میں خوش آمدید۔ ایونٹس بنانا اور ان کا نظم کرنا شروع کرنے کے لیے اپنے ای میل ایڈریس کی تصدیق کریں۔",
      "textExpires": "اس تصدیقی لنک کی میعاد 24 گھنٹے میں ختم ہو جاتی ہے اور اسے صرف ایک بار استعمال کیا جا سکتا ہے۔",
      "textIgnore": "اگر آپ نے یہ اکاؤنٹ نہیں بنایا ہے، تو آپ اس ای میل کو محفوظ طریقے سے نظر انداز کر سکتے ہیں۔"
    },
    "passwordReset": {
      "subject": "اپنا پاس ورڈ دوبارہ ترتیب دیں — SnapUp Events",
      "documentTitle": "اپنا SnapUp Events پاس ورڈ دوبارہ ترتیب دیں۔",
      "preheader": "اپنا SnapUp Events پاس ورڈ دوبارہ ترتیب دینے کے لیے اس محفوظ، واحد استعمال کا لنک استعمال کریں۔",
      "headerLabel": "اکاؤنٹ سیکیورٹی",
      "eyebrow": "پاس ورڈ کی بازیابی۔",
      "heading": "اپنا پاس ورڈ دوبارہ ترتیب دیں۔",
      "introduction": "ہمیں آپ کے SnapUp Events اکاؤنٹ کے لیے نیا پاس ورڈ بنانے کی درخواست موصول ہوئی ہے۔",
      "button": "نیا پاس ورڈ بنائیں",
      "secureLabel": "محفوظ، واحد استعمال کا لنک۔",
      "secureText": "اس کی میعاد 30 منٹ میں ختم ہو جاتی ہے۔ اگر آپ نے اس تبدیلی کی درخواست نہیں کی ہے، تو آپ کا موجودہ پاس ورڈ غیر تبدیل شدہ رہے گا۔",
      "textRequest": "ہمیں آپ کا SnapUp Events پاس ورڈ دوبارہ ترتیب دینے کی درخواست موصول ہوئی ہے۔",
      "textExpires": "یہ ری سیٹ لنک 30 منٹ میں ختم ہو جاتا ہے اور صرف ایک بار استعمال کیا جا سکتا ہے۔",
      "textIgnore": "اگر آپ نے پاس ورڈ دوبارہ ترتیب دینے کی درخواست نہیں کی ہے، تو آپ محفوظ طریقے سے اس ای میل کو نظر انداز کر سکتے ہیں۔"
    }
  },
  "fa": {
    "common": {
      "fallbackName": "وجود دارد",
      "hello": "سلام {{name}}،",
      "buttonFallback": "دکمه کار نمی کند؟ این آدرس را کپی و در مرورگر خود پیست کنید:",
      "footerTagline": "هر مهمان هر لحظه یک آلبوم مشترک",
      "footerSecurity": "این یک ایمیل امنیتی حساب خودکار است."
    },
    "verification": {
      "subject": "ایمیل خود را تأیید کنید — SnapUp Events",
      "documentTitle": "ایمیل SnapUp Events خود را تأیید کنید",
      "preheader": "آدرس ایمیل خود را برای شروع ایجاد رویدادها در SnapUp Events تأیید کنید.",
      "headerLabel": "تایید ایمیل",
      "eyebrow": "به SnapUp خوش آمدید",
      "heading": "ایمیل خود را تایید کنید",
      "introduction": "آدرس ایمیل خود را برای شروع ایجاد رویدادها، به اشتراک گذاری کدهای QR و جمع آوری هر لحظه مهمان در یک آلبوم مشترک، تأیید کنید.",
      "button": "ایمیل من را تایید کنید",
      "secureLabel": "لینک امن:",
      "secureText": "این لینک 24 ساعت دیگر منقضی می شود و فقط یک بار قابل استفاده است. اگر شما این حساب را ایجاد نکرده اید، هیچ اقدامی لازم نیست.",
      "textWelcome": "به SnapUp Events خوش آمدید. آدرس ایمیل خود را برای شروع ایجاد و مدیریت رویدادها تأیید کنید.",
      "textExpires": "این پیوند تأیید در عرض 24 ساعت منقضی می شود و فقط یک بار قابل استفاده است.",
      "textIgnore": "اگر شما این حساب را ایجاد نکرده اید، می توانید با خیال راحت این ایمیل را نادیده بگیرید."
    },
    "passwordReset": {
      "subject": "رمز عبور خود را بازنشانی کنید — SnapUp Events",
      "documentTitle": "رمز عبور SnapUp Events خود را بازنشانی کنید",
      "preheader": "از این پیوند امن و یکبار مصرف برای بازنشانی رمز عبور SnapUp Events خود استفاده کنید.",
      "headerLabel": "امنیت حساب",
      "eyebrow": "بازیابی رمز عبور",
      "heading": "رمز عبور خود را بازنشانی کنید.",
      "introduction": "ما درخواستی برای ایجاد رمز عبور جدید برای حساب SnapUp Events شما دریافت کردیم.",
      "button": "رمز عبور جدید ایجاد کنید",
      "secureLabel": "لینک ایمن و یکبار مصرف",
      "secureText": "30 دقیقه دیگر منقضی می شود. اگر شما این تغییر را درخواست نکرده اید، رمز عبور فعلی شما بدون تغییر باقی می ماند.",
      "textRequest": "ما درخواستی برای بازنشانی رمز عبور SnapUp Events شما دریافت کردیم.",
      "textExpires": "این پیوند بازنشانی در عرض 30 دقیقه منقضی می‌شود و فقط یک بار قابل استفاده است.",
      "textIgnore": "اگر بازنشانی رمز عبور را درخواست نکرده‌اید، می‌توانید با خیال راحت این ایمیل را نادیده بگیرید."
    }
  },
  "ja": {
    "common": {
      "fallbackName": "そこに",
      "hello": "{{name}} さん、こんにちは。",
      "buttonFallback": "ボタンが機能しないのですが？このアドレスをコピーしてブラウザに貼り付けます。",
      "footerTagline": "ゲスト全員。あらゆる瞬間。 1 つの共有アルバム。",
      "footerSecurity": "これは自動アカウントセキュリティメールです。"
    },
    "verification": {
      "subject": "メールアドレスを確認してください — SnapUp Events",
      "documentTitle": "SnapUp Events メールを確認してください",
      "preheader": "SnapUp Events でイベントの作成を開始するには、メール アドレスを確認してください。",
      "headerLabel": "メール認証",
      "eyebrow": "SnapUp へようこそ",
      "heading": "メールアドレスを確認してください",
      "introduction": "メール アドレスを確認して、イベントの作成、QR コードの共有、ゲストのあらゆる瞬間を 1 つの共有アルバムに収集し始めます。",
      "button": "メールアドレスを確認してください",
      "secureLabel": "安全なリンク:",
      "secureText": "このリンクの有効期限は 24 時間であり、使用できるのは 1 回だけです。このアカウントを作成していない場合は、何もする必要はありません。",
      "textWelcome": "SnapUp Events へようこそ。イベントの作成と管理を開始するには、メール アドレスを確認してください。",
      "textExpires": "この確認リンクは 24 時間で期限切れになり、使用できるのは 1 回だけです。",
      "textIgnore": "このアカウントを作成していない場合は、このメールを無視しても問題ありません。"
    },
    "passwordReset": {
      "subject": "パスワードをリセットします — SnapUp Events",
      "documentTitle": "SnapUp Events パスワードをリセットします",
      "preheader": "この安全な使い捨てリンクを使用して、SnapUp Events パスワードをリセットします。",
      "headerLabel": "アカウントのセキュリティ",
      "eyebrow": "パスワードの回復",
      "heading": "パスワードをリセットします。",
      "introduction": "SnapUp Events アカウントの新しいパスワードを作成するリクエストを受け取りました。",
      "button": "新しいパスワードを作成する",
      "secureLabel": "安全な使い捨てリンク。",
      "secureText": "有効期限は 30 分です。この変更をリクエストしなかった場合、現在のパスワードは変更されません。",
      "textRequest": "SnapUp Events パスワードをリセットするリクエストを受け取りました。",
      "textExpires": "このリセット リンクは 30 分で期限切れになり、使用できるのは 1 回だけです。",
      "textIgnore": "パスワードのリセットをリクエストしていない場合は、このメールを無視しても問題ありません。"
    }
  },
  "zh": {
    "common": {
      "fallbackName": "那里",
      "hello": "你好{{name}}，",
      "buttonFallback": "按钮不起作用？复制该地址并将其粘贴到您的浏览器中：",
      "footerTagline": "每位客人。每一刻。一张共享专辑。",
      "footerSecurity": "这是一封自动帐户安全电子邮件。"
    },
    "verification": {
      "subject": "验证您的电子邮件 — SnapUp Events",
      "documentTitle": "验证您的 SnapUp Events 电子邮件",
      "preheader": "验证您的电子邮件地址以开始在 SnapUp Events 上创建活动。",
      "headerLabel": "邮箱验证",
      "eyebrow": "欢迎来到SnapUp",
      "heading": "验证您的电子邮件",
      "introduction": "确认您的电子邮件地址以开始创建活动、共享 QR 代码以及将每一位来宾时刻收集到一个共享相册中。",
      "button": "验证我的电子邮件",
      "secureLabel": "安全链接：",
      "secureText": "此链接将在 24 小时内过期，并且只能使用一次。如果您没有创建此帐户，则无需执行任何操作。",
      "textWelcome": "欢迎来到SnapUp Events。验证您的电子邮件地址以开始创建和管理活动。",
      "textExpires": "此验证链接将在 24 小时后过期，并且只能使用一次。",
      "textIgnore": "如果您没有创建此帐户，您可以安全地忽略此电子邮件。"
    },
    "passwordReset": {
      "subject": "重置您的密码 — SnapUp Events",
      "documentTitle": "重置您的 SnapUp Events 密码",
      "preheader": "使用此安全的一次性链接重置您的 SnapUp Events 密码。",
      "headerLabel": "账户安全",
      "eyebrow": "密码恢复",
      "heading": "重置您的密码。",
      "introduction": "我们收到了为您的 SnapUp Events 帐户创建新密码的请求。",
      "button": "创建新密码",
      "secureLabel": "安全的一次性链接。",
      "secureText": "30 分钟后到期。如果您没有请求进行此更改，您当前的密码将保持不变。",
      "textRequest": "我们收到了重置您的 SnapUp Events 密码的请求。",
      "textExpires": "此重置链接将在 30 分钟后过期，并且只能使用一次。",
      "textIgnore": "如果您没有请求重置密码，您可以放心地忽略这封电子邮件。"
    }
  },
  "ko": {
    "common": {
      "fallbackName": "거기",
      "hello": "안녕하세요 {{name}} 님,",
      "buttonFallback": "버튼이 작동하지 않나요? 다음 주소를 복사하여 브라우저에 붙여넣으세요.",
      "footerTagline": "모든 손님. 매 순간. 공유 앨범 1개",
      "footerSecurity": "이 이메일은 자동 계정 보안 이메일입니다."
    },
    "verification": {
      "subject": "이메일 확인 — SnapUp Events",
      "documentTitle": "SnapUp Events 이메일을 확인하세요",
      "preheader": "SnapUp Events에 이벤트 생성을 시작하려면 이메일 주소를 확인하세요.",
      "headerLabel": "이메일 인증",
      "eyebrow": "SnapUp에 오신 것을 환영합니다.",
      "heading": "이메일을 확인하세요",
      "introduction": "이벤트 생성, QR 코드 공유, 게스트의 모든 순간을 하나의 공유 앨범에 수집하려면 이메일 주소를 확인하세요.",
      "button": "내 이메일을 확인하세요",
      "secureLabel": "보안 링크:",
      "secureText": "이 링크는 24시간 후에 만료되며 한 번만 사용할 수 있습니다. 이 계정을 만들지 않은 경우 별도의 조치가 필요하지 않습니다.",
      "textWelcome": "SnapUp Events에 오신 것을 환영합니다. 이벤트 생성 및 관리를 시작하려면 이메일 주소를 확인하세요.",
      "textExpires": "이 확인 링크는 24시간 후에 만료되며 한 번만 사용할 수 있습니다.",
      "textIgnore": "이 계정을 만들지 않으셨다면 이 이메일을 무시하셔도 됩니다."
    },
    "passwordReset": {
      "subject": "비밀번호 재설정 — SnapUp Events",
      "documentTitle": "SnapUp Events 비밀번호 재설정",
      "preheader": "이 안전한 일회용 링크를 사용하여 SnapUp Events 비밀번호를 재설정하세요.",
      "headerLabel": "계정 보안",
      "eyebrow": "비밀번호 복구",
      "heading": "비밀번호를 재설정하세요.",
      "introduction": "귀하의 SnapUp Events 계정에 대한 새 비밀번호를 생성해 달라는 요청을 받았습니다.",
      "button": "새 비밀번호 만들기",
      "secureLabel": "안전한 일회용 링크.",
      "secureText": "30분 후에 만료됩니다. 변경을 요청하지 않으셨다면 현재 비밀번호는 변경되지 않은 상태로 유지됩니다.",
      "textRequest": "SnapUp Events 비밀번호 재설정 요청을 받았습니다.",
      "textExpires": "이 재설정 링크는 30분 후에 만료되며 한 번만 사용할 수 있습니다.",
      "textIgnore": "비밀번호 재설정을 요청하지 않으셨다면 이 이메일을 무시하셔도 됩니다."
    }
  },
  "pt": {
    "common": {
      "fallbackName": "lá",
      "hello": "Olá {{name}},",
      "buttonFallback": "O botão não funciona? Copie e cole este endereço em seu navegador:",
      "footerTagline": "Cada convidado. Cada momento. Um álbum compartilhado.",
      "footerSecurity": "Este é um e-mail automatizado de segurança da conta."
    },
    "verification": {
      "subject": "Verifique seu e-mail — SnapUp Events",
      "documentTitle": "Verifique seu e-mail SnapUp Events",
      "preheader": "Verifique seu endereço de e-mail para começar a criar eventos em SnapUp Events.",
      "headerLabel": "Verificação de e-mail",
      "eyebrow": "Bem-vindo ao SnapUp",
      "heading": "Verifique seu e-mail",
      "introduction": "Confirme seu endereço de e-mail para começar a criar eventos, compartilhar códigos QR e coletar todos os momentos dos convidados em um álbum compartilhado.",
      "button": "Verifique meu e-mail",
      "secureLabel": "Link seguro:",
      "secureText": "Este link expira em 24 horas e só pode ser usado uma vez. Se você não criou esta conta, nenhuma ação será necessária.",
      "textWelcome": "Bem-vindo ao SnapUp Events. Verifique seu endereço de e-mail para começar a criar e gerenciar eventos.",
      "textExpires": "Este link de verificação expira em 24 horas e só pode ser usado uma vez.",
      "textIgnore": "Se você não criou esta conta, pode ignorar este e-mail com segurança."
    },
    "passwordReset": {
      "subject": "Redefinir sua senha — SnapUp Events",
      "documentTitle": "Redefina sua senha SnapUp Events",
      "preheader": "Use este link seguro e descartável para redefinir sua senha SnapUp Events.",
      "headerLabel": "Segurança da conta",
      "eyebrow": "Recuperação de senha",
      "heading": "Redefina sua senha.",
      "introduction": "Recebemos uma solicitação para criar uma nova senha para sua conta SnapUp Events.",
      "button": "Crie uma nova senha",
      "secureLabel": "Link seguro e de uso único.",
      "secureText": "Expira em 30 minutos. Se você não solicitou esta alteração, sua senha atual permanecerá inalterada.",
      "textRequest": "Recebemos uma solicitação para redefinir sua senha SnapUp Events.",
      "textExpires": "Este link de redefinição expira em 30 minutos e só pode ser usado uma vez.",
      "textIgnore": "Se você não solicitou uma redefinição de senha, pode ignorar este e-mail com segurança."
    }
  },
  "ru": {
    "common": {
      "fallbackName": "там",
      "hello": "Привет {{name}}!",
      "buttonFallback": "Кнопка не работает? Скопируйте и вставьте этот адрес в свой браузер:",
      "footerTagline": "Каждый гость. Каждый момент. Один общий альбом.",
      "footerSecurity": "Это автоматическое электронное письмо для обеспечения безопасности учетной записи."
    },
    "verification": {
      "subject": "Подтвердите свой адрес электронной почты — SnapUp Events",
      "documentTitle": "Подтвердите свой адрес электронной почты SnapUp Events",
      "preheader": "Подтвердите свой адрес электронной почты, чтобы начать создавать мероприятия на SnapUp Events.",
      "headerLabel": "Проверка электронной почты",
      "eyebrow": "Добро пожаловать в SnapUp",
      "heading": "Подтвердите свой адрес электронной почты",
      "introduction": "Подтвердите свой адрес электронной почты, чтобы начать создавать мероприятия, делиться кодами QR и собирать моменты каждого гостя в одном общем альбоме.",
      "button": "Подтвердите мою электронную почту",
      "secureLabel": "Безопасная ссылка:",
      "secureText": "Срок действия этой ссылки истекает через 24 часа, и ее можно использовать только один раз. Если вы не создавали эту учетную запись, никаких действий не требуется.",
      "textWelcome": "Добро пожаловать в SnapUp Events. Подтвердите свой адрес электронной почты, чтобы начать создавать мероприятия и управлять ими.",
      "textExpires": "Срок действия этой ссылки для проверки истекает через 24 часа, и ее можно использовать только один раз.",
      "textIgnore": "Если вы не создавали эту учетную запись, вы можете смело игнорировать это письмо."
    },
    "passwordReset": {
      "subject": "Сбросьте пароль — SnapUp Events",
      "documentTitle": "Сбросьте пароль SnapUp Events",
      "preheader": "Используйте эту безопасную одноразовую ссылку для сброса пароля SnapUp Events.",
      "headerLabel": "Безопасность аккаунта",
      "eyebrow": "Восстановление пароля",
      "heading": "Сбросьте пароль.",
      "introduction": "Мы получили запрос на создание нового пароля для вашей учетной записи SnapUp Events.",
      "button": "Создать новый пароль",
      "secureLabel": "Безопасная одноразовая ссылка.",
      "secureText": "Срок действия истекает через 30 минут. Если вы не запрашивали это изменение, ваш текущий пароль останется неизменным.",
      "textRequest": "Мы получили запрос на сброс вашего пароля SnapUp Events.",
      "textExpires": "Срок действия этой ссылки для сброса истекает через 30 минут, и ее можно использовать только один раз.",
      "textIgnore": "Если вы не запрашивали сброс пароля, вы можете смело игнорировать это письмо."
    }
  },
  "id": {
    "common": {
      "fallbackName": "di sana",
      "hello": "Halo {{name}},",
      "buttonFallback": "Tombol tidak berfungsi? Salin dan tempel alamat ini ke browser Anda:",
      "footerTagline": "Setiap tamu. Setiap saat. Satu album bersama.",
      "footerSecurity": "Ini adalah email keamanan akun otomatis."
    },
    "verification": {
      "subject": "Verifikasi email Anda — SnapUp Events",
      "documentTitle": "Verifikasi email SnapUp Events Anda",
      "preheader": "Verifikasi alamat email Anda untuk mulai membuat acara di SnapUp Events.",
      "headerLabel": "Verifikasi email",
      "eyebrow": "Selamat datang di SnapUp",
      "heading": "Verifikasi email Anda",
      "introduction": "Konfirmasikan alamat email Anda untuk mulai membuat acara, membagikan kode QR, dan mengumpulkan setiap momen tamu dalam satu album bersama.",
      "button": "Verifikasi email saya",
      "secureLabel": "Tautan aman:",
      "secureText": "Tautan ini kedaluwarsa dalam 24 jam dan hanya dapat digunakan satu kali. Jika Anda tidak membuat akun ini, tidak ada tindakan yang diperlukan.",
      "textWelcome": "Selamat datang di SnapUp Events. Verifikasi alamat email Anda untuk mulai membuat dan mengelola acara.",
      "textExpires": "Tautan verifikasi ini akan habis masa berlakunya dalam 24 jam dan hanya dapat digunakan satu kali.",
      "textIgnore": "Jika Anda tidak membuat akun ini, Anda dapat mengabaikan email ini dengan aman."
    },
    "passwordReset": {
      "subject": "Setel ulang kata sandi Anda — SnapUp Events",
      "documentTitle": "Setel ulang kata sandi SnapUp Events Anda",
      "preheader": "Gunakan tautan sekali pakai yang aman ini untuk mengatur ulang kata sandi SnapUp Events Anda.",
      "headerLabel": "Keamanan akun",
      "eyebrow": "Pemulihan kata sandi",
      "heading": "Setel ulang kata sandi Anda.",
      "introduction": "Kami menerima permintaan untuk membuat kata sandi baru untuk akun SnapUp Events Anda.",
      "button": "Buat kata sandi baru",
      "secureLabel": "Tautan aman dan sekali pakai.",
      "secureText": "Masa berlakunya habis dalam 30 menit. Jika Anda tidak meminta perubahan ini, kata sandi Anda saat ini tetap tidak berubah.",
      "textRequest": "Kami menerima permintaan untuk mengatur ulang kata sandi SnapUp Events Anda.",
      "textExpires": "Tautan reset ini kedaluwarsa dalam 30 menit dan hanya dapat digunakan satu kali.",
      "textIgnore": "Jika Anda tidak meminta pengaturan ulang kata sandi, Anda dapat mengabaikan email ini dengan aman."
    }
  },
  "pl": {
    "common": {
      "fallbackName": "tam",
      "hello": "Witaj {{name}},",
      "buttonFallback": "Przycisk nie działa? Skopiuj i wklej ten adres do swojej przeglądarki:",
      "footerTagline": "Każdy gość. W każdej chwili. Jeden udostępniony album.",
      "footerSecurity": "To jest automatyczna wiadomość e-mail dotycząca bezpieczeństwa konta."
    },
    "verification": {
      "subject": "Zweryfikuj swój adres e-mail — SnapUp Events",
      "documentTitle": "Zweryfikuj swój adres e-mail SnapUp Events",
      "preheader": "Zweryfikuj swój adres e-mail, aby rozpocząć tworzenie wydarzeń na SnapUp Events.",
      "headerLabel": "Weryfikacja e-mailowa",
      "eyebrow": "Witamy w SnapUp",
      "heading": "Zweryfikuj swój adres e-mail",
      "introduction": "Potwierdź swój adres e-mail, aby rozpocząć tworzenie wydarzeń, udostępnianie kodów QR i gromadzenie chwil gości w jednym udostępnionym albumie.",
      "button": "Zweryfikuj mój e-mail",
      "secureLabel": "Bezpieczny link:",
      "secureText": "Ten link wygasa w ciągu 24 godzin i można go użyć tylko raz. Jeśli to nie Ty utworzyłeś to konto, nie jest wymagane żadne działanie.",
      "textWelcome": "Witamy w SnapUp Events. Zweryfikuj swój adres e-mail, aby rozpocząć tworzenie wydarzeń i zarządzanie nimi.",
      "textExpires": "Ten link weryfikacyjny wygasa po 24 godzinach i można go użyć tylko raz.",
      "textIgnore": "Jeśli to nie Ty utworzyłeś to konto, możesz bezpiecznie zignorować tę wiadomość e-mail."
    },
    "passwordReset": {
      "subject": "Zresetuj hasło — SnapUp Events",
      "documentTitle": "Zresetuj swoje hasło SnapUp Events",
      "preheader": "Użyj tego bezpiecznego, jednorazowego łącza, aby zresetować hasło SnapUp Events.",
      "headerLabel": "Bezpieczeństwo konta",
      "eyebrow": "Odzyskiwanie hasła",
      "heading": "Zresetuj swoje hasło.",
      "introduction": "Otrzymaliśmy prośbę o utworzenie nowego hasła dla Twojego konta SnapUp Events.",
      "button": "Utwórz nowe hasło",
      "secureLabel": "Bezpieczny, jednorazowy link.",
      "secureText": "Wygasa za 30 minut. Jeśli nie prosiłeś o tę zmianę, Twoje obecne hasło pozostanie niezmienione.",
      "textRequest": "Otrzymaliśmy prośbę o zresetowanie Twojego hasła SnapUp Events.",
      "textExpires": "Ten link resetujący wygasa po 30 minutach i można go użyć tylko raz.",
      "textIgnore": "Jeśli nie prosiłeś o zresetowanie hasła, możesz bezpiecznie zignorować tę wiadomość."
    }
  },
  "vi": {
    "common": {
      "fallbackName": "ở đó",
      "hello": "Xin chào {{name}},",
      "buttonFallback": "Nút không hoạt động? Sao chép và dán địa chỉ này vào trình duyệt của bạn:",
      "footerTagline": "Mỗi vị khách. Mọi khoảnh khắc. Một album được chia sẻ.",
      "footerSecurity": "Đây là email bảo mật tài khoản tự động."
    },
    "verification": {
      "subject": "Xác minh email của bạn — SnapUp Events",
      "documentTitle": "Xác minh email SnapUp Events của bạn",
      "preheader": "Xác minh địa chỉ email của bạn để bắt đầu tạo sự kiện trên SnapUp Events.",
      "headerLabel": "Xác minh email",
      "eyebrow": "Chào mừng đến với SnapUp",
      "heading": "Xác minh email của bạn",
      "introduction": "Xác nhận địa chỉ email của bạn để bắt đầu tạo sự kiện, chia sẻ mã QR và thu thập mọi khoảnh khắc của khách trong một album chia sẻ.",
      "button": "Xác minh email của tôi",
      "secureLabel": "Liên kết an toàn:",
      "secureText": "Liên kết này sẽ hết hạn sau 24 giờ và chỉ có thể được sử dụng một lần. Nếu bạn không tạo tài khoản này thì không cần thực hiện hành động nào.",
      "textWelcome": "Chào mừng đến với SnapUp Events. Xác minh địa chỉ email của bạn để bắt đầu tạo và quản lý sự kiện.",
      "textExpires": "Liên kết xác minh này sẽ hết hạn sau 24 giờ và chỉ có thể được sử dụng một lần.",
      "textIgnore": "Nếu bạn không tạo tài khoản này, bạn có thể yên tâm bỏ qua email này."
    },
    "passwordReset": {
      "subject": "Đặt lại mật khẩu của bạn — SnapUp Events",
      "documentTitle": "Đặt lại mật khẩu SnapUp Events của bạn",
      "preheader": "Hãy sử dụng liên kết an toàn, dùng một lần này để đặt lại mật khẩu SnapUp Events của bạn.",
      "headerLabel": "Bảo mật tài khoản",
      "eyebrow": "Khôi phục mật khẩu",
      "heading": "Đặt lại mật khẩu của bạn.",
      "introduction": "Chúng tôi đã nhận được yêu cầu tạo mật khẩu mới cho tài khoản SnapUp Events của bạn.",
      "button": "Tạo mật khẩu mới",
      "secureLabel": "Liên kết an toàn, sử dụng một lần.",
      "secureText": "Nó hết hạn sau 30 phút. Nếu bạn không yêu cầu thay đổi này, mật khẩu hiện tại của bạn vẫn không thay đổi.",
      "textRequest": "Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu SnapUp Events của bạn.",
      "textExpires": "Liên kết đặt lại này sẽ hết hạn sau 30 phút và chỉ có thể được sử dụng một lần.",
      "textIgnore": "Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể yên tâm bỏ qua email này."
    }
  },
  "uk": {
    "common": {
      "fallbackName": "там",
      "hello": "Привіт {{name}},",
      "buttonFallback": "Кнопка не працює? Скопіюйте та вставте цю адресу у свій браузер:",
      "footerTagline": "Кожен гість. Кожну мить. Один спільний альбом.",
      "footerSecurity": "Це автоматичний електронний лист для безпеки облікового запису."
    },
    "verification": {
      "subject": "Підтвердьте свою електронну адресу — SnapUp Events",
      "documentTitle": "Підтвердьте свою електронну адресу SnapUp Events",
      "preheader": "Підтвердьте свою електронну адресу, щоб почати створювати події на SnapUp Events.",
      "headerLabel": "Підтвердження електронної пошти",
      "eyebrow": "Ласкаво просимо до SnapUp",
      "heading": "Підтвердьте свою електронну адресу",
      "introduction": "Підтвердьте свою адресу електронної пошти, щоб почати створювати події, ділитися кодами QR і збирати моменти кожного гостя в одному спільному альбомі.",
      "button": "Підтвердити мій email",
      "secureLabel": "Безпечне посилання:",
      "secureText": "Термін дії цього посилання закінчується через 24 години, і ним можна скористатися лише один раз. Якщо ви не створювали цей обліковий запис, нічого робити не потрібно.",
      "textWelcome": "Ласкаво просимо до SnapUp Events. Підтвердьте свою електронну адресу, щоб почати створювати події та керувати ними.",
      "textExpires": "Термін дії цього посилання для підтвердження закінчується через 24 години, і його можна використати лише один раз.",
      "textIgnore": "Якщо ви не створювали цей обліковий запис, можете сміливо ігнорувати цей електронний лист."
    },
    "passwordReset": {
      "subject": "Скинути пароль — SnapUp Events",
      "documentTitle": "Скиньте свій пароль SnapUp Events",
      "preheader": "Скористайтеся цим безпечним одноразовим посиланням, щоб скинути свій пароль SnapUp Events.",
      "headerLabel": "Безпека облікового запису",
      "eyebrow": "Відновлення пароля",
      "heading": "Скинути пароль.",
      "introduction": "Ми отримали запит на створення нового пароля для вашого облікового запису SnapUp Events.",
      "button": "Створіть новий пароль",
      "secureLabel": "Безпечне одноразове посилання.",
      "secureText": "Термін дії закінчується через 30 хвилин. Якщо ви не запитували цю зміну, ваш поточний пароль залишиться незмінним.",
      "textRequest": "Ми отримали запит на скидання вашого пароля SnapUp Events.",
      "textExpires": "Це посилання для скидання закінчується через 30 хвилин, і його можна використати лише один раз.",
      "textIgnore": "Якщо ви не надсилали запит на скидання пароля, можете сміливо ігнорувати цей електронний лист."
    }
  },
  "th": {
    "common": {
      "fallbackName": "ที่นั่น",
      "hello": "สวัสดี {{name}}",
      "buttonFallback": "ปุ่มไม่ทำงาน? คัดลอกและวางที่อยู่นี้ลงในเบราว์เซอร์ของคุณ:",
      "footerTagline": "แขกทุกท่าน. ทุกช่วงเวลา หนึ่งอัลบั้มที่แชร์",
      "footerSecurity": "นี่คืออีเมลรักษาความปลอดภัยบัญชีอัตโนมัติ"
    },
    "verification": {
      "subject": "ยืนยันอีเมลของคุณ — SnapUp Events",
      "documentTitle": "ยืนยันอีเมล SnapUp Events ของคุณ",
      "preheader": "ยืนยันที่อยู่อีเมลของคุณเพื่อเริ่มสร้างกิจกรรมบน SnapUp Events",
      "headerLabel": "การยืนยันอีเมล",
      "eyebrow": "ยินดีต้อนรับสู่ SnapUp",
      "heading": "ยืนยันอีเมลของคุณ",
      "introduction": "ยืนยันที่อยู่อีเมลของคุณเพื่อเริ่มสร้างกิจกรรม แบ่งปันรหัส QR และรวบรวมทุกช่วงเวลาของแขกรับเชิญไว้ในอัลบั้มที่แชร์เพียงอัลบั้มเดียว",
      "button": "ยืนยันอีเมลของฉัน",
      "secureLabel": "ลิงค์ที่ปลอดภัย:",
      "secureText": "ลิงก์นี้จะหมดอายุใน 24 ชั่วโมงและสามารถใช้ได้เพียงครั้งเดียวเท่านั้น หากคุณไม่ได้สร้างบัญชีนี้ ก็ไม่จำเป็นต้องดำเนินการใดๆ",
      "textWelcome": "ยินดีต้อนรับสู่ SnapUp Events ยืนยันที่อยู่อีเมลของคุณเพื่อเริ่มสร้างและจัดการกิจกรรม",
      "textExpires": "ลิงก์ยืนยันนี้จะหมดอายุใน 24 ชั่วโมงและสามารถใช้ได้เพียงครั้งเดียวเท่านั้น",
      "textIgnore": "หากคุณไม่ได้สร้างบัญชีนี้ คุณสามารถเพิกเฉยต่ออีเมลนี้ได้อย่างปลอดภัย"
    },
    "passwordReset": {
      "subject": "รีเซ็ตรหัสผ่านของคุณ — SnapUp Events",
      "documentTitle": "รีเซ็ตรหัสผ่าน SnapUp Events ของคุณ",
      "preheader": "ใช้ลิงก์แบบใช้ครั้งเดียวที่ปลอดภัยนี้เพื่อรีเซ็ตรหัสผ่าน SnapUp Events ของคุณ",
      "headerLabel": "ความปลอดภัยของบัญชี",
      "eyebrow": "การกู้คืนรหัสผ่าน",
      "heading": "รีเซ็ตรหัสผ่านของคุณ",
      "introduction": "เราได้รับคำขอให้สร้างรหัสผ่านใหม่สำหรับบัญชี SnapUp Events ของคุณ",
      "button": "สร้างรหัสผ่านใหม่",
      "secureLabel": "ลิงก์แบบใช้ครั้งเดียวที่ปลอดภัย",
      "secureText": "มันจะหมดอายุใน 30 นาที หากคุณไม่ได้ร้องขอการเปลี่ยนแปลงนี้ รหัสผ่านปัจจุบันของคุณจะยังคงไม่เปลี่ยนแปลง",
      "textRequest": "เราได้รับคำขอให้รีเซ็ตรหัสผ่าน SnapUp Events ของคุณ",
      "textExpires": "ลิงก์รีเซ็ตนี้จะหมดอายุใน 30 นาที และสามารถใช้ได้เพียงครั้งเดียวเท่านั้น",
      "textIgnore": "หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน คุณสามารถเพิกเฉยต่ออีเมลฉบับนี้ได้อย่างปลอดภัย"
    }
  },
  "cs": {
    "common": {
      "fallbackName": "tam",
      "hello": "Dobrý den {{name}},",
      "buttonFallback": "Tlačítko nefunguje? Zkopírujte a vložte tuto adresu do svého prohlížeče:",
      "footerTagline": "Každý host. Každou chvíli. Jedno sdílené album.",
      "footerSecurity": "Toto je automatický e-mail pro zabezpečení účtu."
    },
    "verification": {
      "subject": "Ověřte svůj e-mail — SnapUp Events",
      "documentTitle": "Ověřte svůj e-mail SnapUp Events",
      "preheader": "Ověřte svou e-mailovou adresu a začněte vytvářet události na SnapUp Events.",
      "headerLabel": "Ověření e-mailem",
      "eyebrow": "Vítejte na SnapUp",
      "heading": "Ověřte svůj e-mail",
      "introduction": "Potvrďte svou e-mailovou adresu a začněte vytvářet události, sdílet QR kódy a shromažďovat každý moment hosta do jednoho sdíleného alba.",
      "button": "Ověřte můj email",
      "secureLabel": "Zabezpečený odkaz:",
      "secureText": "Platnost tohoto odkazu vyprší za 24 hodin a lze jej použít pouze jednou. Pokud jste tento účet nevytvořili, není vyžadována žádná akce.",
      "textWelcome": "Vítejte v SnapUp Events. Chcete-li začít vytvářet a spravovat události, ověřte svou e-mailovou adresu.",
      "textExpires": "Platnost tohoto ověřovacího odkazu vyprší za 24 hodin a lze jej použít pouze jednou.",
      "textIgnore": "Pokud jste si tento účet nevytvořili, můžete tento e-mail bezpečně ignorovat."
    },
    "passwordReset": {
      "subject": "Resetujte své heslo — SnapUp Events",
      "documentTitle": "Resetujte své heslo SnapUp Events",
      "preheader": "Pomocí tohoto zabezpečeného jednorázového odkazu resetujte své heslo SnapUp Events.",
      "headerLabel": "Zabezpečení účtu",
      "eyebrow": "Obnovení hesla",
      "heading": "Obnovte heslo.",
      "introduction": "Obdrželi jsme žádost o vytvoření nového hesla pro váš účet SnapUp Events.",
      "button": "Vytvořte nové heslo",
      "secureLabel": "Bezpečný odkaz na jedno použití.",
      "secureText": "Vyprší za 30 minut. Pokud jste o tuto změnu nepožádali, vaše aktuální heslo zůstane nezměněno.",
      "textRequest": "Obdrželi jsme žádost o resetování vašeho hesla SnapUp Events.",
      "textExpires": "Platnost tohoto odkazu pro reset vyprší za 30 minut a lze jej použít pouze jednou.",
      "textIgnore": "Pokud jste o reset hesla nepožádali, můžete tento e-mail bezpečně ignorovat."
    }
  },
  "he": {
    "common": {
      "fallbackName": "שם",
      "hello": "שלום {{name}},",
      "buttonFallback": "הכפתור לא עובד? העתק והדבק כתובת זו בדפדפן שלך:",
      "footerTagline": "כל אורח. כל רגע. אלבום אחד משותף.",
      "footerSecurity": "זהו דוא\"ל אוטומטי לאבטחת חשבון."
    },
    "verification": {
      "subject": "אמת את האימייל שלך - SnapUp Events",
      "documentTitle": "אמת את האימייל SnapUp Events שלך",
      "preheader": "אמת את כתובת הדוא\"ל שלך כדי להתחיל ליצור אירועים ב-SnapUp Events.",
      "headerLabel": "אימות דוא\"ל",
      "eyebrow": "ברוכים הבאים אל SnapUp",
      "heading": "אמת את האימייל שלך",
      "introduction": "אשר את כתובת האימייל שלך כדי להתחיל ליצור אירועים, לשתף קודי QR, ולאסוף כל רגע אורח באלבום משותף אחד.",
      "button": "אמת את האימייל שלי",
      "secureLabel": "קישור מאובטח:",
      "secureText": "קישור זה יפוג בעוד 24 שעות וניתן להשתמש בו רק פעם אחת. אם לא יצרת חשבון זה, אין צורך בפעולה.",
      "textWelcome": "ברוכים הבאים אל SnapUp Events. אמת את כתובת הדוא\"ל שלך כדי להתחיל ליצור ולנהל אירועים.",
      "textExpires": "קישור אימות זה יפוג בעוד 24 שעות וניתן להשתמש בו רק פעם אחת.",
      "textIgnore": "אם לא יצרת חשבון זה, תוכל להתעלם בבטחה מהאימייל הזה."
    },
    "passwordReset": {
      "subject": "אפס את הסיסמה שלך - SnapUp Events",
      "documentTitle": "אפס את הסיסמה SnapUp Events שלך",
      "preheader": "השתמש בקישור מאובטח זה לשימוש חד פעמי כדי לאפס את סיסמת SnapUp Events שלך.",
      "headerLabel": "אבטחת חשבון",
      "eyebrow": "שחזור סיסמא",
      "heading": "אפס את הסיסמה שלך.",
      "introduction": "קיבלנו בקשה ליצור סיסמה חדשה לחשבון SnapUp Events שלך.",
      "button": "צור סיסמה חדשה",
      "secureLabel": "קישור מאובטח לשימוש חד פעמי.",
      "secureText": "זה יפוג בעוד 30 דקות. אם לא ביקשת שינוי זה, הסיסמה הנוכחית שלך תישאר ללא שינוי.",
      "textRequest": "קיבלנו בקשה לאפס את הסיסמה SnapUp Events שלך.",
      "textExpires": "קישור האיפוס הזה יפוג בעוד 30 דקות וניתן להשתמש בו רק פעם אחת.",
      "textIgnore": "אם לא ביקשת איפוס סיסמה, תוכל להתעלם בבטחה מאימייל זה."
    }
  },
  "hu": {
    "common": {
      "fallbackName": "ott",
      "hello": "Kedves {{name}}!",
      "buttonFallback": "Nem működik a gomb? Másolja ki és illessze be ezt a címet a böngészőjébe:",
      "footerTagline": "Minden vendég. Minden pillanatban. Egy megosztott album.",
      "footerSecurity": "Ez egy automatikus fiókbiztonsági e-mail."
    },
    "verification": {
      "subject": "Igazolja e-mail-címét – SnapUp Events",
      "documentTitle": "Igazolja SnapUp Events e-mail-címét",
      "preheader": "Erősítse meg e-mail címét az események létrehozásának megkezdéséhez a SnapUp Events webhelyen.",
      "headerLabel": "E-mail ellenőrzés",
      "eyebrow": "Üdvözli a SnapUp",
      "heading": "Igazolja e-mail-címét",
      "introduction": "Erősítse meg e-mail címét az események létrehozásához, a QR kódok megosztásához, és minden vendég pillanatának egy megosztott albumba gyűjtéséhez.",
      "button": "Igazolja az e-mail címemet",
      "secureLabel": "Biztonságos link:",
      "secureText": "Ez a link 24 órán belül lejár, és csak egyszer használható. Ha nem Ön hozta létre ezt a fiókot, nincs teendője.",
      "textWelcome": "Üdvözli a SnapUp Events. Az események létrehozásának és kezelésének megkezdéséhez igazolja e-mail címét.",
      "textExpires": "Ez az ellenőrző link 24 órán belül lejár, és csak egyszer használható.",
      "textIgnore": "Ha nem Ön hozta létre ezt a fiókot, nyugodtan figyelmen kívül hagyhatja ezt az e-mailt."
    },
    "passwordReset": {
      "subject": "Állítsa vissza jelszavát — SnapUp Events",
      "documentTitle": "Állítsa vissza a SnapUp Events jelszavát",
      "preheader": "Ezzel a biztonságos, egyszer használatos hivatkozással állítsa vissza SnapUp Events jelszavát.",
      "headerLabel": "Számlabiztonság",
      "eyebrow": "Jelszó helyreállítás",
      "heading": "Állítsa vissza jelszavát.",
      "introduction": "Megkaptuk a kérést, hogy hozzunk létre új jelszót SnapUp Events fiókjához.",
      "button": "Hozzon létre egy új jelszót",
      "secureLabel": "Biztonságos, egyszer használatos link.",
      "secureText": "30 perc múlva lejár. Ha nem Ön kérte ezt a módosítást, jelenlegi jelszava változatlan marad.",
      "textRequest": "Kaptunk egy kérést, hogy állítsuk vissza SnapUp Events jelszavát.",
      "textExpires": "Ez a visszaállítási hivatkozás 30 percen belül lejár, és csak egyszer használható.",
      "textIgnore": "Ha nem kérte a jelszó visszaállítását, nyugodtan figyelmen kívül hagyhatja ezt az e-mailt."
    }
  },
  "sv": {
    "common": {
      "fallbackName": "där",
      "hello": "Hej {{name}},",
      "buttonFallback": "Fungerar inte knappen? Kopiera och klistra in den här adressen i din webbläsare:",
      "footerTagline": "Varje gäst. Varje ögonblick. Ett delat album.",
      "footerSecurity": "Detta är ett automatiskt kontosäkerhetsmeddelande."
    },
    "verification": {
      "subject": "Verifiera din e-post — SnapUp Events",
      "documentTitle": "Verifiera din SnapUp Events e-post",
      "preheader": "Verifiera din e-postadress för att börja skapa händelser på SnapUp Events.",
      "headerLabel": "E-postverifiering",
      "eyebrow": "Välkommen till SnapUp",
      "heading": "Verifiera din e-post",
      "introduction": "Bekräfta din e-postadress för att börja skapa händelser, dela QR-koder och samla varje gästögonblick i ett delat album.",
      "button": "Verifiera min e-post",
      "secureLabel": "Säker länk:",
      "secureText": "Denna länk upphör om 24 timmar och kan endast användas en gång. Om du inte skapade det här kontot krävs ingen åtgärd.",
      "textWelcome": "Välkommen till SnapUp Events. Verifiera din e-postadress för att börja skapa och hantera händelser.",
      "textExpires": "Denna verifieringslänk löper ut om 24 timmar och kan bara användas en gång.",
      "textIgnore": "Om du inte skapade det här kontot kan du lugnt ignorera det här e-postmeddelandet."
    },
    "passwordReset": {
      "subject": "Återställ ditt lösenord — SnapUp Events",
      "documentTitle": "Återställ ditt SnapUp Events-lösenord",
      "preheader": "Använd den här säkra engångslänken för att återställa ditt SnapUp Events-lösenord.",
      "headerLabel": "Kontosäkerhet",
      "eyebrow": "Lösenordsåterställning",
      "heading": "Återställ ditt lösenord.",
      "introduction": "Vi fick en begäran om att skapa ett nytt lösenord för ditt SnapUp Events-konto.",
      "button": "Skapa ett nytt lösenord",
      "secureLabel": "Säker engångslänk.",
      "secureText": "Den löper ut om 30 minuter. Om du inte begärde denna ändring förblir ditt nuvarande lösenord oförändrat.",
      "textRequest": "Vi fick en begäran om att återställa ditt SnapUp Events-lösenord.",
      "textExpires": "Denna återställningslänk går ut om 30 minuter och kan bara användas en gång.",
      "textIgnore": "Om du inte begärde en lösenordsåterställning kan du lugnt ignorera detta e-postmeddelande."
    }
  },
  "bn": {
    "common": {
      "fallbackName": "সেখানে",
      "hello": "হ্যালো {{name}},",
      "buttonFallback": "বোতাম কাজ করছে না? আপনার ব্রাউজারে এই ঠিকানাটি অনুলিপি করুন এবং আটকান:",
      "footerTagline": "প্রত্যেক অতিথি। প্রতি মুহূর্তে। একটি শেয়ার করা অ্যালবাম।",
      "footerSecurity": "এটি একটি স্বয়ংক্রিয় অ্যাকাউন্ট-নিরাপত্তা ইমেল।"
    },
    "verification": {
      "subject": "আপনার ইমেল যাচাই করুন — SnapUp Events",
      "documentTitle": "আপনার SnapUp Events ইমেল যাচাই করুন",
      "preheader": "SnapUp Events এ ইভেন্ট তৈরি শুরু করতে আপনার ইমেল ঠিকানা যাচাই করুন।",
      "headerLabel": "ইমেল যাচাইকরণ",
      "eyebrow": "SnapUp এ স্বাগতম",
      "heading": "আপনার ইমেল যাচাই করুন",
      "introduction": "ইভেন্ট তৈরি করা, QR কোড শেয়ার করা, এবং একটি শেয়ার করা অ্যালবামে প্রতিটি অতিথি মুহূর্ত সংগ্রহ করতে আপনার ইমেল ঠিকানা নিশ্চিত করুন৷",
      "button": "আমার ইমেইল যাচাই করুন",
      "secureLabel": "নিরাপদ লিঙ্ক:",
      "secureText": "এই লিঙ্কটি 24 ঘন্টার মধ্যে মেয়াদ শেষ হয়ে যায় এবং শুধুমাত্র একবার ব্যবহার করা যেতে পারে। আপনি যদি এই অ্যাকাউন্টটি তৈরি না করে থাকেন তবে কোনও পদক্ষেপের প্রয়োজন নেই৷",
      "textWelcome": "SnapUp Events এ স্বাগতম। ইভেন্টগুলি তৈরি এবং পরিচালনা শুরু করতে আপনার ইমেল ঠিকানা যাচাই করুন৷",
      "textExpires": "এই যাচাইকরণ লিঙ্কটি 24 ঘন্টার মধ্যে মেয়াদ শেষ হয়ে যায় এবং শুধুমাত্র একবার ব্যবহার করা যেতে পারে।",
      "textIgnore": "আপনি যদি এই অ্যাকাউন্টটি তৈরি না করে থাকেন তবে আপনি নিরাপদে এই ইমেলটিকে উপেক্ষা করতে পারেন৷"
    },
    "passwordReset": {
      "subject": "আপনার পাসওয়ার্ড পুনরায় সেট করুন — SnapUp Events",
      "documentTitle": "আপনার SnapUp Events পাসওয়ার্ড রিসেট করুন",
      "preheader": "আপনার SnapUp Events পাসওয়ার্ড পুনরায় সেট করতে এই সুরক্ষিত, একক-ব্যবহারের লিঙ্কটি ব্যবহার করুন৷",
      "headerLabel": "অ্যাকাউন্ট নিরাপত্তা",
      "eyebrow": "পাসওয়ার্ড পুনরুদ্ধার",
      "heading": "আপনার পাসওয়ার্ড রিসেট করুন।",
      "introduction": "আমরা আপনার SnapUp Events অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড তৈরি করার অনুরোধ পেয়েছি।",
      "button": "একটি নতুন পাসওয়ার্ড তৈরি করুন",
      "secureLabel": "সুরক্ষিত, একক-ব্যবহারের লিঙ্ক।",
      "secureText": "এটি 30 মিনিটের মধ্যে মেয়াদ শেষ হয়ে যায়। আপনি এই পরিবর্তনের অনুরোধ না করলে, আপনার বর্তমান পাসওয়ার্ড অপরিবর্তিত থাকবে।",
      "textRequest": "আমরা আপনার SnapUp Events পাসওয়ার্ড পুনরায় সেট করার জন্য একটি অনুরোধ পেয়েছি।",
      "textExpires": "এই রিসেট লিঙ্কটি 30 মিনিটের মধ্যে মেয়াদ শেষ হয়ে যায় এবং শুধুমাত্র একবার ব্যবহার করা যেতে পারে।",
      "textIgnore": "আপনি যদি পাসওয়ার্ড রিসেট করার অনুরোধ না করে থাকেন, তাহলে আপনি নিরাপদে এই ইমেলটি উপেক্ষা করতে পারেন৷"
    }
  },
  "ms": {
    "common": {
      "fallbackName": "di sana",
      "hello": "Helo {{name}},",
      "buttonFallback": "Butang tidak berfungsi? Salin dan tampal alamat ini ke dalam penyemak imbas anda:",
      "footerTagline": "Setiap tetamu. Setiap saat. Satu album kongsi.",
      "footerSecurity": "Ini ialah e-mel keselamatan akaun automatik."
    },
    "verification": {
      "subject": "Sahkan e-mel anda — SnapUp Events",
      "documentTitle": "Sahkan e-mel SnapUp Events anda",
      "preheader": "Sahkan alamat e-mel anda untuk mula membuat acara di SnapUp Events.",
      "headerLabel": "Pengesahan e-mel",
      "eyebrow": "Selamat datang ke SnapUp",
      "heading": "Sahkan e-mel anda",
      "introduction": "Sahkan alamat e-mel anda untuk mula membuat acara, berkongsi kod QR dan mengumpul setiap detik tetamu dalam satu album kongsi.",
      "button": "Sahkan e-mel saya",
      "secureLabel": "Pautan selamat:",
      "secureText": "Pautan ini tamat tempoh dalam masa 24 jam dan hanya boleh digunakan sekali. Jika anda tidak membuat akaun ini, tiada tindakan diperlukan.",
      "textWelcome": "Selamat datang ke SnapUp Events. Sahkan alamat e-mel anda untuk mula membuat dan mengurus acara.",
      "textExpires": "Pautan pengesahan ini tamat tempoh dalam masa 24 jam dan hanya boleh digunakan sekali.",
      "textIgnore": "Jika anda tidak membuat akaun ini, anda boleh mengabaikan e-mel ini dengan selamat."
    },
    "passwordReset": {
      "subject": "Tetapkan semula kata laluan anda — SnapUp Events",
      "documentTitle": "Tetapkan semula kata laluan SnapUp Events anda",
      "preheader": "Gunakan pautan selamat dan sekali guna ini untuk menetapkan semula kata laluan SnapUp Events anda.",
      "headerLabel": "Keselamatan akaun",
      "eyebrow": "Pemulihan kata laluan",
      "heading": "Tetapkan semula kata laluan anda.",
      "introduction": "Kami menerima permintaan untuk membuat kata laluan baharu untuk akaun SnapUp Events anda.",
      "button": "Buat kata laluan baharu",
      "secureLabel": "Pautan selamat, sekali guna.",
      "secureText": "Ia tamat tempoh dalam 30 minit. Jika anda tidak meminta perubahan ini, kata laluan semasa anda kekal tidak berubah.",
      "textRequest": "Kami menerima permintaan untuk menetapkan semula kata laluan SnapUp Events anda.",
      "textExpires": "Pautan set semula ini tamat tempoh dalam masa 30 minit dan hanya boleh digunakan sekali.",
      "textIgnore": "Jika anda tidak meminta tetapan semula kata laluan, anda boleh mengabaikan e-mel ini dengan selamat."
    }
  },
  "fil": {
    "common": {
      "fallbackName": "doon",
      "hello": "Kamusta {{name}},",
      "buttonFallback": "Hindi gumagana ang button? Kopyahin at i-paste ang address na ito sa iyong browser:",
      "footerTagline": "Bawat bisita. Bawat sandali. Isang nakabahaging album.",
      "footerSecurity": "Ito ay isang automated na account-security email."
    },
    "verification": {
      "subject": "I-verify ang iyong email — SnapUp Events",
      "documentTitle": "I-verify ang iyong SnapUp Events email",
      "preheader": "I-verify ang iyong email address upang simulan ang paggawa ng mga kaganapan sa SnapUp Events.",
      "headerLabel": "Email verification",
      "eyebrow": "Maligayang pagdating sa SnapUp",
      "heading": "I-verify ang iyong email",
      "introduction": "Kumpirmahin ang iyong email address upang simulan ang paggawa ng mga kaganapan, pagbabahagi ng QR code, at pagkolekta ng bawat sandali ng bisita sa isang nakabahaging album.",
      "button": "I-verify ang aking email",
      "secureLabel": "Secure na link:",
      "secureText": "Mag-e-expire ang link na ito sa loob ng 24 na oras at isang beses lang magagamit. Kung hindi mo ginawa ang account na ito, walang kinakailangang aksyon.",
      "textWelcome": "Maligayang pagdating sa SnapUp Events. I-verify ang iyong email address upang simulan ang paggawa at pamamahala ng mga kaganapan.",
      "textExpires": "Mag-e-expire ang link sa pag-verify na ito sa loob ng 24 na oras at isang beses lang magagamit.",
      "textIgnore": "Kung hindi mo ginawa ang account na ito, maaari mong ligtas na balewalain ang email na ito."
    },
    "passwordReset": {
      "subject": "I-reset ang iyong password — SnapUp Events",
      "documentTitle": "I-reset ang iyong SnapUp Events password",
      "preheader": "Gamitin ang secure, single-use na link na ito para i-reset ang iyong SnapUp Events password.",
      "headerLabel": "Seguridad ng account",
      "eyebrow": "Pagbawi ng password",
      "heading": "I-reset ang iyong password.",
      "introduction": "Nakatanggap kami ng kahilingang gumawa ng bagong password para sa iyong SnapUp Events account.",
      "button": "Gumawa ng bagong password",
      "secureLabel": "Secure, single-use na link.",
      "secureText": "Mag-e-expire ito sa loob ng 30 minuto. Kung hindi mo hiniling ang pagbabagong ito, mananatiling hindi nagbabago ang iyong kasalukuyang password.",
      "textRequest": "Nakatanggap kami ng kahilingang i-reset ang iyong SnapUp Events password.",
      "textExpires": "Mag-e-expire ang link na ito sa pag-reset sa loob ng 30 minuto at isang beses lang magagamit.",
      "textIgnore": "Kung hindi ka humiling ng pag-reset ng password, maaari mong ligtas na balewalain ang email na ito."
    }
  }
};

function normalizeEmailLanguage(value) {
  const requested = String(value || "en").toLowerCase().split(",")[0].split(";")[0].trim();
  const base = requested.split("-")[0];
  return Object.prototype.hasOwnProperty.call(EMAIL_COPIES, base) ? base : "en";
}

function getEmailCopy(value) {
  const language = normalizeEmailLanguage(value);
  return {
    language,
    metadata: EMAIL_LANGUAGE_METADATA[language],
    copy: EMAIL_COPIES[language],
  };
}

module.exports = {
  EMAIL_LANGUAGE_METADATA,
  getEmailCopy,
  normalizeEmailLanguage,
};
