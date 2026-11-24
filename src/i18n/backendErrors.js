const ENTITIES = {
  Invoice: 'الفاتورة',
  'Invoice attachment': 'مرفق الفاتورة',
  'Invoice Attachment': 'مرفق الفاتورة',
  Boq: 'جدول الكميات',
  boq: 'جدول الكميات',
  'Boq Item': 'بند جدول الكميات',
  'Boq by Project Code': 'جدول الكميات لهذا المشروع',
  'Boq by project code': 'جدول الكميات لهذا المشروع',
  'Boq attachment': 'مرفق جدول الكميات',
  'Tracker cycle': 'دورة الفوترة',
  'Change request': 'طلب التغيير',
  'Change request attachment': 'مرفق طلب التغيير',
  'Financial claim action': 'قيد المطالبة المالية',
  WorkflowTask: 'المهمة',
  User: 'المستخدم',
  'Active Directory User': 'مستخدم الدليل',
  Role: 'الدور',
  Group: 'المجموعة',
};

const FIELDS = {
  Quantity: 'الكمية',
  'Unit Cost': 'تكلفة الوحدة',
  'Unit cost': 'تكلفة الوحدة',
  'English name': 'الاسم بالإنجليزية',
  'Arabic name': 'الاسم بالعربية',
  'Billing frequency': 'دورية الفوترة',
  'Expected Invoicing Date': 'تاريخ الفوترة المتوقع',
  'Expected invoicing date': 'تاريخ الفوترة المتوقع',
  'Baseline Invoicing Date': 'تاريخ الفوترة الأساسي',
  'Baseline invoicing date': 'تاريخ الفوترة الأساسي',
  Notes: 'الملاحظات',
};

const EXACT = {
  'Quantity cannot be left empty.': 'لا يمكن ترك الكمية فارغة.',
  'Quantity cannot be less than 0.': 'لا يمكن أن تكون الكمية أقل من 0.',
  'Unsupported billing frequency.': 'دورية الفوترة غير مدعومة.',
  'Billing frequency must be 1 (Monthly), 2 (Quarterly), 3 (Yearly) or 4 (Milestone).': 'يجب أن تكون دورية الفوترة شهرية أو ربع سنوية أو سنوية أو حسب المرحلة.',
  'Cannot modify committed tracker cycles.': 'لا يمكن تعديل دورات الفوترة الملتزم بها.',
  'Invoicing date must be on or after the project start date.': 'يجب ألا يسبق تاريخ الفوترة تاريخ بداية المشروع.',
  'Invoicing date must be on or before the project finish date.': 'يجب ألا يتجاوز تاريخ الفوترة تاريخ نهاية المشروع.',
  'Invoicing date cannot be in the past.': 'لا يمكن أن يكون تاريخ الفوترة في الماضي.',
  'An error occurred while processing the request. Please login again.': 'حدث خطأ أثناء معالجة الطلب. يرجى تسجيل الدخول مرة أخرى.',
  'This account is not active. Please contact an administrator.': 'هذا الحساب غير نشط. يرجى التواصل مع المسؤول.',
  'Somebody else changed this invoice while you were working on it. Open it again to see the latest.': 'عدّل شخص آخر هذه الفاتورة أثناء عملك عليها. افتحها مرة أخرى لرؤية آخر نسخة.',
  'Invoice has no invoice number yet.': 'لا يوجد رقم لهذه الفاتورة بعد.',
  'Invoice has no baseline collection date yet.': 'لا يوجد تاريخ تحصيل أساسي لهذه الفاتورة بعد.',
  'Invoice has no collected amount yet.': 'لا يوجد مبلغ محصّل لهذه الفاتورة بعد.',
  'Invoice has no collected date yet.': 'لا يوجد تاريخ تحصيل لهذه الفاتورة بعد.',
  'The financial claim reference number must be exactly 12 digits.': 'يجب أن يتكون الرقم المرجعي للمطالبة المالية من 12 رقمًا بالضبط.',
  'The collected amount must be more than 0.': 'يجب أن يكون المبلغ المحصّل أكبر من 0.',
  'The collected amount cannot be more than the invoice amount.': 'لا يمكن أن يتجاوز المبلغ المحصّل مبلغ الفاتورة.',
  'Files can only be added to an open invoice, not one that is Collected or Cancelled.': 'لا يمكن إضافة ملفات إلا إلى فاتورة مفتوحة، وليس إلى فاتورة محصّلة أو ملغاة.',
  'Somebody else changed this claim action while you were working on it. Open it again to see the latest.': 'عدّل شخص آخر هذا القيد أثناء عملك عليه. افتحه مرة أخرى لرؤية آخر نسخة.',
  'EPM did not return a form digest, so the project could not be updated.': 'لم يُرجع EPM البيانات المطلوبة، لذلك تعذّر تحديث المشروع.',
  'Network error. Please check your connection and try again.': 'خطأ في الشبكة. يرجى التحقق من الاتصال والمحاولة مرة أخرى.',
  'Your session has expired. Please sign in again.': 'انتهت جلستك. يرجى تسجيل الدخول مرة أخرى.',
  'Your account is no longer active. Please sign in again.': 'لم يعد حسابك نشطًا. يرجى تسجيل الدخول مرة أخرى.',
};

const entity = (name) => ENTITIES[name] ?? null;
const field = (name) => FIELDS[name] ?? null;

const PATTERNS = [
  [/^(.+) with identifier '.*' was not found\.$/, ([, e]) => entity(e) && `تعذّر العثور على ${entity(e)}.`],
  [/^(.+) with .+: '.*' was not found\.$/, ([, e]) => entity(e) && `تعذّر العثور على ${entity(e)}.`],
  [/^(.+) with identifier '.*' already exists\.$/, ([, e]) => entity(e) && `يوجد بالفعل سجل مطابق: ${entity(e)}.`],
  [/^(.+) with .+: '.*' already exists\.$/, ([, e]) => entity(e) && `يوجد بالفعل سجل مطابق: ${entity(e)}.`],
  [/^(.+) must be greater than zero\.$/, ([, f]) => field(f) && `يجب أن تكون قيمة ${field(f)} أكبر من صفر.`],
  [/^(.+) must be more than 0\.$/, ([, f]) => field(f) && `يجب أن تكون قيمة ${field(f)} أكبر من 0.`],
  [/^(.+) cannot be left empty\.$/, ([, f]) => field(f) && `لا يمكن ترك ${field(f)} فارغًا.`],
  [/^(.+) has an invalid Date Format$/, ([, f]) => field(f) && `صيغة ${field(f)} غير صحيحة.`],
  [/^These BOQ items cannot be sent for approval: (.+)\. Only items that are Draft or Rejected can be, so deselect the rest\.$/, ([, ids]) => `لا يمكن إرسال هذه البنود للموافقة: ${ids}. يمكن إرسال البنود بحالة مسودة أو مرفوضة فقط، لذا ألغِ تحديد البقية.`],
  [/^The BOQ items add up to ([\d,.]+), which is more than the project value of ([\d,.]+)\.$/, ([, total, value]) => `مجموع بنود جدول الكميات ${total} دولار، وهو أكبر من قيمة المشروع ${value} دولار.`],
  [/^Only the person who raised (.+) can edit it\.$/, ([, n]) => `لا يمكن تعديل ${n} إلا لمن قدّمه.`],
  [/^(.+) is still open on this BOQ\. Only one change request can be open at a time\.$/, ([, n]) => `${n} لا يزال مفتوحًا على جدول الكميات هذا، ولا يمكن فتح أكثر من طلب تغيير واحد في الوقت نفسه.`],
  [/^(.+) can only be edited after it is returned to you\.$/, ([, n]) => `لا يمكن تعديل ${n} إلا بعد إعادته إليك.`],
  [/^(.+) is closed, so it cannot be changed\.$/, ([, n]) => `${n} مغلق، لذلك لا يمكن تغييره.`],
  [/^These BOQ items are part of an open change request, so they cannot be changed until it is approved, rejected or cancelled: (.+)\.$/, ([, items]) => `هذه البنود ضمن طلب تغيير مفتوح، ولا يمكن تغييرها حتى يُعتمد أو يُرفض أو يُلغى: ${items}.`],
  [/^No change request can be submitted on (.+): EPM has no main project for it with a code like 23\/116\.$/, ([, p]) => `لا يمكن تقديم طلب تغيير على ${p}: لا يوجد له مشروع رئيسي في EPM برمز مثل 23/116.`],
  [/^Only the person who uploaded '(.+)' can remove it\.$/, ([, f]) => `لا يمكن إزالة «${f}» إلا لمن رفعه.`],
  [/^You cannot view (.+): you do not have access to project (.+)\.$/, ([, n, p]) => `لا يمكنك عرض ${n}: ليست لديك صلاحية على المشروع ${p}.`],
  [/^You cannot raise a change request here: you do not have access to project (.+)\.$/, ([, p]) => `لا يمكنك تقديم طلب تغيير هنا: ليست لديك صلاحية على المشروع ${p}.`],
  [/^You do not have access to project (.+)\.$/, ([, p]) => `ليست لديك صلاحية على المشروع ${p}.`],
  [/^You do not have access to contract (.+): none of your projects holds it\.$/, ([, c]) => `ليست لديك صلاحية على العقد ${c}: لا يتبع أيًا من مشاريعك.`],
  [/^Invalid Quantity for Item '(.+)' with Id .+$/, ([, n]) => `الكمية غير صحيحة للبند «${n}».`],
  [/^The uploaded file extension '(.+)' is not allowed\.$/, ([, f]) => `امتداد الملف «${f}» غير مسموح به.`],
  [/^'.+' is not an invoice status\.$/, () => 'حالة الفاتورة غير صحيحة.'],
  [/^These invoices cannot be deleted: (.+)\. Only Rejected or Cancelled invoices can be, so deselect the rest\.$/, ([, names]) => `لا يمكن حذف هذه الفواتير: ${names}. يمكن حذف الفواتير المرفوضة أو الملغاة فقط، لذا ألغِ تحديد البقية.`],
  [/^Invoice (.+) cannot be deleted\. Only Rejected or Cancelled invoices can be\.$/, ([, n]) => `لا يمكن حذف الفاتورة ${n}. يمكن حذف الفواتير المرفوضة أو الملغاة فقط.`],
  [/^Project (.+)'s contract number '(.+)' is not a number, so its financial claims cannot be read from Etimad\.$/, ([, p, c]) => `رقم عقد المشروع ${p} (${c}) ليس رقمًا، لذلك تعذّرت قراءة مطالباته المالية من اعتماد.`],
  [/^Project (.+) is invoiced on Etimad, so its financial claim log comes from Etimad and cannot be changed here\.$/, ([, p]) => `تتم فوترة المشروع ${p} عبر اعتماد، لذلك يأتي سجل مطالباته المالية من اعتماد ولا يمكن تغييره هنا.`],
  [/^Task .+ is not assigned to you\.$/, () => 'هذه المهمة غير مسندة إليك.'],
  [/^'(.+)' on step '.+' cannot be answered without a comment\.$/, ([, l]) => `لا يمكن اختيار «${l}» بدون تعليق.`],
  [/^'(.+)' on step '.+' cannot be answered without a reason\.$/, ([, l]) => `لا يمكن اختيار «${l}» بدون سبب.`],
  [/^'Other' was picked on '(.+)', so the reason has to be typed\.$/, ([, l]) => `تم اختيار «أخرى» في «${l}»، لذلك يجب كتابة السبب.`],
  [/^'.+' is not one of the outcomes on step '.+'\.$/, () => 'هذا الخيار غير متاح في هذه الخطوة.'],
];

function arabicFor(message) {
  const text = message.trim();
  if (EXACT[text]) return EXACT[text];
  for (const [pattern, build] of PATTERNS) {
    const match = pattern.exec(text);
    if (!match) continue;
    const result = build(match);
    if (result) return result;
  }
  return message;
}

const inArabic = () => typeof document !== 'undefined' && document.documentElement.lang === 'ar';

/**
 * @param {string} message a backend or network message
 * @returns {string} its Arabic wording when the page is in Arabic and the message is known, otherwise the message
 */
export function localizeBackendMessage(message) {
  return typeof message === 'string' && inArabic() ? arabicFor(message) : message;
}

/**
 * @param {Object<string, string|string[]>|null} errors field errors from the backend
 * @returns {Object<string, string|string[]>|null}
 */
export function localizeBackendErrors(errors) {
  if (!errors || typeof errors !== 'object' || !inArabic()) return errors;
  return Object.fromEntries(Object.entries(errors).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.map(localizeBackendMessage) : localizeBackendMessage(value),
  ]));
}
