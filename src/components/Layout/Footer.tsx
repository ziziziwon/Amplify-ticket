import React from "react";
import { Link } from "react-router-dom";
import Logo from "../Logo";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* 상단 섹션 */}
        <div className="footer-grid">
          {/* 회사 정보 */}
          <div className="footer-company">
            <div className="footer-logo">
              <Logo variant="solid" height={28} />
            </div>
            <p className="footer-tagline">소리를 키우다, 무대를 키우다</p>
            <p className="footer-description">
              전세계 아티스트의 내한 공연을 위한<br />
              프리미엄 티켓팅 플랫폼
            </p>
          </div>

          {/* 고객센터 */}
          <div>
            <h3 className="footer-section-title">고객센터</h3>
            <div className="footer-section-list">
              <div className="footer-contact-item">
                <div className="footer-contact-label">전화상담</div>
                <div className="footer-contact-value">1544-1234</div>
              </div>
              
              <div className="footer-contact-item">
                <div className="footer-contact-time">
                  평일 09:00 - 18:00<br />
                  점심시간 12:00 - 13:00<br />
                  주말/공휴일 휴무
                </div>
              </div>

              <div className="footer-contact-item">
                <div className="footer-contact-label">이메일 문의</div>
                <div className="footer-contact-value">support@amplify.com</div>
              </div>
            </div>
          </div>

          {/* 바로가기 */}
          <div>
            <h3 className="footer-section-title">바로가기</h3>
            <div className="footer-section-list">
              <Link to="/support" className="footer-link">
                이용약관
              </Link>
              <Link to="/support" className="footer-link footer-link-primary">
                개인정보처리방침
              </Link>
              <Link to="/support" className="footer-link">
                취소/환불 정책
              </Link>
              <Link to="/notice" className="footer-link">
                공지사항
              </Link>
            </div>
          </div>

          {/* 서비스 */}
          <div>
            <h3 className="footer-section-title">서비스</h3>
            <div className="footer-section-list">
              <Link to="/categories/concert" className="footer-link">
                콘서트
              </Link>
              <Link to="/categories/musical" className="footer-link">
                뮤지컬
              </Link>
              <Link to="/categories/festival" className="footer-link">
                펜클럽·팬미팅
              </Link>
              <Link to="/events" className="footer-link">
                이벤트
              </Link>
            </div>
          </div>
        </div>

        <hr className="footer-divider" />

        {/* 사업자 정보 */}
        <div className="footer-business">
          <p className="footer-business-text">
            <span>(주)앰플리파이</span>
            {" | "}
            <span>대표이사: 정지원</span>
            {" | "}
            <span>사업자등록번호: 123-45-67890</span>
            {" | "}
            <span>통신판매업신고번호: 2025-대구런던-00000</span>
            <br />
            <span>주소: 런던특별시 대구구 멘체스터 시티 123, 4층 (비틀즈, 오아시스빌딩)</span>
            <br />
            <span>호스팅 서비스 제공: AWS</span>
            {" | "}
            <span>개인정보보호책임자: 하리보</span>
            {" ("}
            <a href="mailto:privacy@amplify.com" className="footer-business-link">
              privacy@amplify.com
            </a>
            {")"}
          </p>
        </div>

        {/* 하단 섹션 */}
        <div className="footer-bottom">
          <p className="footer-copyright">© 2025 AMPLIFY Inc. All rights reserved.</p>
          
          {/* SNS 링크 */}
          <div className="footer-social">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              Instagram
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              Twitter
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link"
            >
              Facebook
            </a>
          </div>
        </div>

        {/* 법적 고지 */}
        <div className="footer-legal">
          <p className="footer-legal-text">
            ※ AMPLIFY는 통신판매중개자로서 통신판매의 당사자가 아니며, 상품의 예약, 이용 및 환불 등과 관련한 의무와 책임은 각 판매자에게 있습니다.
            <br />
            ※ 티켓 구매 시 주최사의 취소/환불 규정을 반드시 확인하시기 바랍니다.
          </p>
        </div>
      </div>
    </footer>
  );
}

