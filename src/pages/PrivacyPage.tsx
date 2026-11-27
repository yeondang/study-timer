import LegalLayout, { LegalSection } from '@/components/common/LegalLayout'
import { LEGAL } from '@/lib/legal'

export default function PrivacyPage() {
  return (
    <LegalLayout title="개인정보처리방침">
      <p className="mt-4 text-sm text-slate-700">
        {LEGAL.operator}(이하 "운영자")는 {LEGAL.serviceName}(이하 "서비스") 이용자의 개인정보를 중요하게 여기며
        「개인정보 보호법」을 준수합니다.
      </p>

      <LegalSection title="1. 수집하는 개인정보 항목">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2">구분</th>
                <th className="border border-slate-200 p-2">항목</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 p-2">가입 시 (필수)</td>
                <td className="border border-slate-200 p-2">
                  이메일, 비밀번호(암호화되어 저장), 닉네임(기본값은 이메일 앞부분 또는 구글 계정 이름)
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2">구글 로그인 시</td>
                <td className="border border-slate-200 p-2">구글 계정의 이메일, 이름 등 로그인 인증에 제공되는 기본 정보</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2">이용자가 직접 입력 (선택)</td>
                <td className="border border-slate-200 p-2">프로필 사진, 상태 메시지(이모지·문구), 그룹 이름·소개</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2">서비스 이용 중 생성</td>
                <td className="border border-slate-200 p-2">
                  과목, 공부 기록(날짜·시간·과목), 시간 조정 내역과 사유, 할 일, 목표 시간, 그룹 소속, 현재 공부 상태
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2">버그 제보 시</td>
                <td className="border border-slate-200 p-2">제보 내용, 제보 당시 페이지 주소, 브라우저·기기 정보(User-Agent)</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2">자동 수집</td>
                <td className="border border-slate-200 p-2">
                  접속 기록(IP 주소 등)이 호스팅 및 데이터베이스 사업자의 서버 로그에 생성될 수 있음
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="2. 수집·이용 목적">
        <ul className="list-disc pl-5">
          <li>회원 가입, 본인 확인, 로그인 유지 및 계정 관리</li>
          <li>공부 타이머, 기록, 통계, 플래너 등 서비스 제공</li>
          <li>그룹 기능 제공(그룹원에게 닉네임, 사진, 상태, 공부 시간 표시)</li>
          <li>오류 확인과 문의·제보 처리, 서비스 개선</li>
          <li>부정 이용 방지 및 서비스 안정성 확보</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 보유 및 이용 기간">
        <p>
          개인정보는 <b>회원 탈퇴 시까지</b> 보유하며, 탈퇴하면 지체 없이 파기합니다. 다만 관련 법령에 따라 보존해야
          하는 정보는 해당 기간 동안 별도로 보관합니다. 서버 로그는 각 사업자의 정책에 따라 일정 기간 보관 후
          삭제됩니다.
        </p>
      </LegalSection>

      <LegalSection title="4.운영자의 정보 열람">
        <p>
          운영자는 서비스 운영, 문의·제보 처리, 부정 이용 방지에 필요한 범위에서 이용자의 계정 정보(이메일,
          닉네임)와 공부 기록을 조회할 수 있으며, 부정한 기록은 삭제할 수 있습니다. 조회 및 삭제 내역은
          접근 기록으로 보관합니다.
        </p>
      </LegalSection>

      <LegalSection title="5. 개인정보의 제3자 제공">
        <p>
          운영자는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 법령에 근거가 있거나 수사기관이
          적법한 절차로 요청하는 경우는 예외입니다.
        </p>
        <p>
          <b>이용자 간 공유:</b> 그룹에 참여하면 같은 그룹원에게 닉네임, 프로필 사진, 상태 메시지, 현재 공부 상태와
          과목명, 공부 시간(날짜별 합계)이 표시됩니다. 이는 이용자가 직접 그룹에 참여해 이루어지는 서비스 기능이며,
          그룹을 나가면 더 이상 공개되지 않습니다.
        </p>
      </LegalSection>

      <LegalSection title="6. 개인정보 처리 위탁 및 국외 이전">
        <p>서비스 제공을 위해 아래 사업자의 시스템을 이용하며, 개인정보가 국외에서 처리·보관됩니다.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50">
                <th className="border border-slate-200 p-2">이전받는 자</th>
                <th className="border border-slate-200 p-2">국가</th>
                <th className="border border-slate-200 p-2">이전 항목</th>
                <th className="border border-slate-200 p-2">목적</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-200 p-2">Supabase, Inc.</td>
                <td className="border border-slate-200 p-2">싱가포르 (데이터 저장 지역)</td>
                <td className="border border-slate-200 p-2">1항의 모든 항목</td>
                <td className="border border-slate-200 p-2">로그인, 데이터베이스, 파일 저장</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2">Vercel Inc.</td>
                <td className="border border-slate-200 p-2">미국 등</td>
                <td className="border border-slate-200 p-2">접속 기록(IP 주소 등)</td>
                <td className="border border-slate-200 p-2">웹사이트 호스팅</td>
              </tr>
              <tr>
                <td className="border border-slate-200 p-2">Google LLC</td>
                <td className="border border-slate-200 p-2">미국 등</td>
                <td className="border border-slate-200 p-2">구글 계정 로그인 정보</td>
                <td className="border border-slate-200 p-2">구글 로그인 (선택)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          이전 시점과 방법: 서비스 이용 시 네트워크를 통해 수시로 전송됩니다. 보유 기간은 3항과 같습니다. 국외 이전을
          원하지 않는 경우 가입하지 않거나 탈퇴할 수 있으나, 이 경우 서비스를 이용할 수 없습니다.
        </p>
      </LegalSection>

      <LegalSection title="7. 개인정보의 파기">
        <p>
          탈퇴 시 계정과 관련 데이터(프로필, 공부 기록, 할 일, 그룹 소속, 상태, 제보 등)는 데이터베이스에서 삭제되며,
          삭제된 정보는 복구할 수 없습니다. 이용자가 올린 프로필 사진도 함께 삭제합니다. 내가 만든 그룹은 함께
          삭제됩니다.
        </p>
      </LegalSection>

      <LegalSection title="8. 이용자의 권리">
        <p>
          이용자는 언제든지 자신의 개인정보를 조회·수정(설정 화면의 닉네임, 사진, 상태 메시지)하거나 삭제(회원
          탈퇴)할 수 있으며, 그 밖의 열람·정정·삭제·처리정지 요구는 아래 연락처로 할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="9. 브라우저 저장소 사용">
        <p>
          서비스는 로그인 유지, 진행 중인 타이머 상태, 테마 색상 설정을 위해 이용자 기기의 브라우저 저장소
          (localStorage 등)를 사용합니다. 광고나 행태 분석을 위한 추적 쿠키는 사용하지 않습니다. 브라우저 설정에서
          저장소를 삭제할 수 있으나, 이 경우 로그인이 풀리는 등 일부 기능이 제한될 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="10. 안전성 확보 조치">
        <ul className="list-disc pl-5">
          <li>전송 구간 암호화(HTTPS)와 비밀번호 암호화 저장</li>
          <li>데이터베이스 접근 통제(이용자는 본인 데이터와 같은 그룹원에게 공개된 정보만 조회 가능)</li>
          <li>관리자 권한 키의 클라이언트 비노출 및 접근 최소화</li>
        </ul>
      </LegalSection>

      <LegalSection title="11. 만 14세 미만 아동">
        <p>서비스는 만 14세 이상만 이용할 수 있으며, 만 14세 미만 아동의 개인정보는 수집하지 않습니다.</p>
      </LegalSection>

      <LegalSection title="12. 개인정보 보호책임자 및 문의">
        <p>책임자: {LEGAL.operator}</p>
        <p>이메일: {LEGAL.contactEmail}</p>
        <p>
          기타 침해 신고나 상담은 개인정보침해신고센터(privacy.kisa.or.kr, 국번 없이 118), 개인정보분쟁조정위원회
          (kopico.go.kr, 1833-6972)에 문의할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="13. 방침의 변경">
        <p>이 방침이 변경되면 시행일 7일 전부터 서비스 화면에 공지합니다.</p>
      </LegalSection>
    </LegalLayout>
  )
}