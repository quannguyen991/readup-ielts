import type { Ledger, SkillStatus } from '@/services/mastery/types';
import { signPayload, verifyPayload, type VerifyFailure } from './sign';

/**
 * Chứng chỉ năng lực theo chuẩn W3C Verifiable Credential.
 *
 * NGƯỜI HỌC TỰ CẤP, VÀ ĐIỀU ĐÓ PHẢI ĐƯỢC NÓI RA CHỨ KHÔNG GIẤU. Khoá nằm trên
 * máy người học, nên chữ ký chứng minh đúng MỘT điều: "sổ này không bị sửa kể từ
 * lúc ký, bởi người giữ khoá này". Nó KHÔNG chứng minh có một bên độc lập xác
 * nhận, và cũng KHÔNG chứng minh người học không gian lận lúc làm bài. Một chứng
 * chỉ tự cấp mà được trình bày như bằng cấp là đúng loại nói quá mà dự án này từ
 * chối làm.
 *
 * VẬY SỨC NẶNG ĐẾN TỪ ĐÂU. Từ thứ chứng chỉ TRÍCH DẪN, không phải từ ai ký nó:
 * mỗi kỹ năng mang theo id những nhãn xuất xứ của các câu đã dựng nên kết luận,
 * và người kiểm đối chiếu chúng với kho nhãn công khai. Ai muốn tin thì kiểm
 * được từng mắt xích; không ai bị bắt phải tin ReadUp. Đó cũng chính là nước cờ
 * của hàng rào bịt mắt, áp lên một tầng khác.
 *
 * VÌ SAO TỰ CẤP CHỨ KHÔNG ĐỂ MÁY CHỦ CẤP. Máy chủ cấp thì mạnh hơn về xác nhận,
 * nhưng hồ sơ năng lực của người học lại thành một dịch vụ có thể chết, và người
 * ở nơi không có hạ tầng thì không cầm được gì. Đổi lại sự sang trọng ấy lấy
 * quyền sở hữu là đánh đổi đúng cho bài toán này — miễn là nói thật về chỗ nó yếu.
 */

export const CREDENTIAL_TYPE = 'ReadUpEvidenceCredential';

const CONTEXT = Object.freeze([
  'https://www.w3.org/ns/credentials/v2',
  'https://readup-ielts.vercel.app/ns/evidence/v1',
]);

/** Một kỹ năng như nó xuất hiện trong chứng chỉ. */
export type CredentialSkill = {
  id: string;
  domain: string;
  key: string;
  status: SkillStatus;
  /** Số lượt THẬT SỰ quan sát được, không kể lượt không khoanh bằng chứng. */
  observed: number;
  /** Số lần đạt phép thử chuyển giao trên một nguồn KHÁC. */
  transfers: number;
  updatedAt: string;
  /** Nhãn xuất xứ của các câu đã dựng nên kết luận này. */
  itemLabels?: string[];
};

export type Proof = {
  type: 'DataIntegrityProof';
  cryptosuite: 'eddsa-jcs-2022';
  created: string;
  verificationMethod: string;
  proofPurpose: 'assertionMethod';
  proofValue: string;
};

export type EvidenceCredential = {
  '@context': readonly string[];
  type: readonly string[];
  issuer: string;
  validFrom: string;
  credentialSubject: {
    id: string;
    skills: CredentialSkill[];
  };
  proof: Proof;
};

export type BuildOptions = {
  ledger: Ledger;
  did: string;
  privateKey: Uint8Array;
  /** Mặc định là bây giờ. Truyền vào để dựng lại được đúng một chứng chỉ cũ. */
  issuedAt?: string;
  /** Nhãn xuất xứ theo từng kỹ năng, khoá là `domain:key`. */
  itemLabels?: Record<string, string[]>;
};

/**
 * Kỹ năng chưa quan sát được thì KHÔNG vào chứng chỉ.
 *
 * `unobserved` nghĩa là chưa đo, không phải "đo rồi và kém". Đưa vào thì người
 * đọc sẽ đếm nó như một kỹ năng đã kiểm và trượt — biến một dòng trống thành một
 * lời cáo buộc. Đây là cùng một luật mà `mastery` đã giữ khi tách `observed` ra
 * khỏi `observations`.
 */
function meaningful(status: SkillStatus): boolean {
  return status !== 'unobserved';
}

/** Phần được ký: toàn bộ chứng chỉ TRỪ chính khối proof. */
function payloadOf(vc: Omit<EvidenceCredential, 'proof'>): unknown {
  return vc;
}

export function buildCredential(opts: BuildOptions): EvidenceCredential {
  const issuedAt = opts.issuedAt ?? new Date().toISOString();

  const skills: CredentialSkill[] = Object.entries(opts.ledger)
    .filter(([, rec]) => meaningful(rec.status))
    // Sắp theo id: `Object.entries` giữ thứ tự chèn, mà thứ tự chèn phụ thuộc
    // vào việc người học chạm kỹ năng nào trước. Không sắp thì hai người có
    // cùng nội dung sổ vẫn ra hai chuỗi ký khác nhau.
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([id, rec]) => {
      const labels = opts.itemLabels?.[id];
      const skill: CredentialSkill = {
        id,
        domain: rec.skill.domain,
        key: rec.skill.key,
        status: rec.status,
        observed: rec.observed ?? 0,
        transfers: rec.transfers,
        updatedAt: rec.updatedAt,
      };
      // `lastSourceId` KHÔNG được sao sang: nó là dấu vết người ấy đã học bài
      // nào, lúc nào. Cùng luật với `buildExport` trong `mastery/cohort.ts`.
      if (labels && labels.length > 0) skill.itemLabels = [...labels];
      return skill;
    });

  const unsigned: Omit<EvidenceCredential, 'proof'> = {
    '@context': CONTEXT,
    type: ['VerifiableCredential', CREDENTIAL_TYPE],
    issuer: opts.did,
    validFrom: issuedAt,
    credentialSubject: { id: opts.did, skills },
  };

  return {
    ...unsigned,
    proof: {
      type: 'DataIntegrityProof',
      cryptosuite: 'eddsa-jcs-2022',
      created: issuedAt,
      verificationMethod: `${opts.did}#${opts.did.slice('did:key:'.length)}`,
      proofPurpose: 'assertionMethod',
      proofValue: signPayload(payloadOf(unsigned), opts.privateKey),
    },
  };
}

/** Lỗi ở tầng hình dạng chứng chỉ. Lỗi chữ ký dùng lại mã của `sign.ts`. */
export type CredentialFailure =
  | 'not-an-object'
  | 'missing-proof'
  | 'missing-proof-value'
  | 'wrong-type'
  | 'missing-issuer'
  | 'missing-subject'
  | 'issuer-not-subject';

export const CREDENTIAL_FAILURE_VI: Readonly<Record<CredentialFailure, string>> = Object.freeze({
  'not-an-object': 'Không phải một object JSON',
  'missing-proof': 'Thiếu khối proof',
  'missing-proof-value': 'Khối proof thiếu proofValue',
  'wrong-type': `Không phải ${CREDENTIAL_TYPE}`,
  'missing-issuer': 'Thiếu issuer',
  'missing-subject': 'Thiếu credentialSubject.id',
  'issuer-not-subject': 'issuer khác credentialSubject.id — chứng chỉ này phải là tự cấp',
});

export type CredentialReport =
  | {
      ok: true;
      did: string;
      /** Số kỹ năng có mặt trong chứng chỉ. */
      skills: number;
      /** Số kỹ năng đạt `confirmed` — tức đã qua phép thử chuyển giao. */
      confirmed: number;
      /** Số nhãn xuất xứ được trích dẫn, để bước sau đối chiếu với kho. */
      itemLabels: string[];
    }
  | { ok: false; code: CredentialFailure | VerifyFailure; reason: string };

function reject(code: CredentialFailure): CredentialReport {
  return { ok: false, code, reason: CREDENTIAL_FAILURE_VI[code] };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Kiểm một chứng chỉ đến từ người lạ.
 *
 * KHÔNG BAO GIỜ NÉM. Bộ kiểm nhận file do người khác dán vào; sập vì gặp rác là
 * hỏng đúng việc nó sinh ra để làm. Mọi đầu vào hỏng đều phải ra một câu đọc được.
 */
export function verifyCredential(raw: unknown): CredentialReport {
  if (!isRecord(raw)) return reject('not-an-object');

  const { proof, ...rest } = raw as Record<string, unknown> & { proof?: unknown };
  if (!isRecord(proof)) return reject('missing-proof');
  if (typeof proof.proofValue !== 'string') return reject('missing-proof-value');

  if (!Array.isArray(raw.type) || !raw.type.includes(CREDENTIAL_TYPE)) return reject('wrong-type');

  const issuer = raw.issuer;
  if (typeof issuer !== 'string') return reject('missing-issuer');

  const subject = raw.credentialSubject;
  if (!isRecord(subject) || typeof subject.id !== 'string') return reject('missing-subject');

  /*
    ISSUER PHẢI TRÙNG CHỦ THỂ. Chứng chỉ này theo thiết kế là TỰ CẤP, nên hai
    trường ấy luôn là một. Lệch nhau nghĩa là hoặc file bị sửa, hoặc nó đến từ
    một mô hình cấp phát khác mà bộ kiểm này chưa biết đọc — cả hai đều phải nói
    ra thay vì lặng lẽ kiểm chữ ký theo issuer rồi báo hợp lệ.
  */
  if (issuer !== subject.id) return reject('issuer-not-subject');

  const verdict = verifyPayload(rest, proof.proofValue, issuer);
  if (!verdict.ok) return { ok: false, code: verdict.code, reason: verdict.reason };

  const skills = Array.isArray(subject.skills) ? subject.skills : [];
  const labels: string[] = [];
  let confirmed = 0;
  for (const s of skills) {
    if (!isRecord(s)) continue;
    if (s.status === 'confirmed') confirmed += 1;
    if (Array.isArray(s.itemLabels)) {
      for (const l of s.itemLabels) if (typeof l === 'string') labels.push(l);
    }
  }

  return { ok: true, did: issuer, skills: skills.length, confirmed, itemLabels: labels };
}
