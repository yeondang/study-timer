import LegalLayout, { LegalSection } from '@/components/common/LegalLayout'
import { LEGAL } from '@/lib/legal'

export default function TermsPage() {
  return (
    <LegalLayout title="이용약관">
      <LegalSection title="제1조 (목적)">
        <p>
          이 약관은 {LEGAL.operator}(이하 "운영자")가 제공하는 {LEGAL.serviceName}(이하 "서비스")의
          이용과 관련하여 운영자와 이용자의 권리, 의무 및 책임사항을 정하는 것을 목적으로 합니다.
        </p>
      </LegalSection>

      <LegalSection title="제2조 (서비스의 내용)">
        <p>서비스는 다음 기능을 제공합니다.</p>
        <ul className="list-disc pl-5">
          <li>과목별 공부 시간 측정(타이머)과 공부 기록 저장</li>
          <li>날짜별 할 일 및 과목별 목표 시간 관리</li>
          <li>일별·주간·월간 통계</li>
          <li>스터디 그룹 생성·참여와 그룹원의 공부 상태 및 시간 공유</li>
          <li>학습 도구(외부 사전·검색 사이트) 바로가기</li>
        </ul>
        <p>운영자는 서비스를 개선하기 위해 기능을 추가·변경·중단할 수 있습니다.</p>
      </LegalSection>

      <LegalSection title="제3조 (가입 및 계정)">
        <ol className="list-decimal pl-5">
          <li>이용자는 이메일 또는 구글 계정으로 가입할 수 있으며, 이 약관과 개인정보처리방침에 동의해야 합니다.</li>
          <li>서비스는 <b>만 14세 이상</b>만 가입할 수 있습니다.</li>
          <li>이용자는 계정 정보를 직접 관리해야 하며, 타인에게 양도하거나 대여할 수 없습니다.</li>
          <li>계정 관리 소홀로 생긴 문제에 대해 운영자는 고의 또는 중대한 과실이 없는 한 책임지지 않습니다.</li>
        </ol>
      </LegalSection>

      <LegalSection title="제4조 (이용자의 의무)">
        <p>이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul className="list-disc pl-5">
          <li>타인의 정보 도용, 허위 정보 등록</li>
          <li>공부 시간을 속이기 위한 부정한 방법의 사용(프로그램, 서비스 오류 악용, API 직접 호출 등)</li>
          <li>시간 조정 기능을 이용한 고의적인 허위 기록으로 그룹원을 기만하는 행위</li>
          <li>닉네임, 프로필 사진, 상태 메시지, 그룹 이름·소개에 불법적이거나 타인에게 불쾌감을 주는 내용(욕설, 음란물, 혐오 표현, 타인의 개인정보 등)을 게시하는 행위</li>
          <li>서비스의 정상 운영을 방해하는 행위(과도한 요청, 스팸 가입, 취약점 악용 등)</li>
          <li>타인의 권리(저작권, 초상권 등)를 침해하는 행위</li>
        </ul>
      </LegalSection>

      <LegalSection title="제5조 (그룹 이용)">
        <ol className="list-decimal pl-5">
          <li>그룹에 참여하면 내 <b>닉네임, 프로필 사진, 상태 메시지, 현재 공부 상태와 과목명, 오늘 및 날짜별 공부 시간</b>이 같은 그룹원에게 공개됩니다.</li>
          <li>그룹장은 그룹 이름·소개·최대 인원을 수정하고 멤버를 내보내거나 초대 코드를 재발급할 수 있습니다.</li>
          <li>그룹장이 탈퇴하면 해당 그룹은 삭제됩니다.</li>
          <li>그룹 내 분쟁은 당사자 간에 해결하며, 운영자는 이에 개입할 의무가 없습니다.</li>
        </ol>
      </LegalSection>

      <LegalSection title="제6조 (이용 제한)">
        <p>
          이용자가 제4조를 위반하면 운영자는 사전 통지 없이 해당 게시 내용을 삭제하거나, 기록을 수정·삭제하거나,
          서비스 이용을 제한하거나 계정을 삭제할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="제7조 (서비스의 중단과 책임의 제한)">
        <ol className="list-decimal pl-5">
          <li>서비스는 무료로 제공되며, 점검, 장애, 외부 서비스(호스팅, 데이터베이스 등)의 사정으로 일시 중단될 수 있습니다.</li>
          <li>브라우저와 기기 특성(절전, 탭 비활성화, 네트워크 불안정 등)으로 타이머와 상태 표시가 부정확할 수 있으며, 이로 인한 손해에 대해 운영자는 고의 또는 중대한 과실이 없는 한 책임지지 않습니다.</li>
          <li>이용자가 입력한 정보의 정확성과 그룹원 간 공개 내용에 대한 책임은 이용자에게 있습니다.</li>
          <li>운영자는 데이터 보관에 합리적인 노력을 하지만 데이터의 영구 보존을 보증하지 않습니다.</li>
        </ol>
      </LegalSection>

      <LegalSection title="제8조 (탈퇴)">
        <p>
          이용자는 설정 화면에서 언제든지 탈퇴할 수 있으며, 탈퇴하면 계정과 관련 데이터가 삭제되고 복구할 수
          없습니다. 자세한 내용은 개인정보처리방침을 따릅니다.
        </p>
      </LegalSection>

      <LegalSection title="제9조 (약관의 변경)">
        <p>
          운영자는 필요한 경우 약관을 변경할 수 있으며, 변경 시 시행일 7일 전(이용자에게 불리한 변경은 30일 전)에
          서비스 화면에 공지합니다. 공지 후 이용자가 서비스를 계속 이용하면 변경에 동의한 것으로 봅니다.
        </p>
      </LegalSection>

      <LegalSection title="제10조 (문의 및 준거법)">
        <p>문의: {LEGAL.contactEmail}</p>
        <p>이 약관은 대한민국 법령에 따르며, 분쟁이 생기면 민사소송법상 관할 법원에서 해결합니다.</p>
      </LegalSection>
    </LegalLayout>
  )
}