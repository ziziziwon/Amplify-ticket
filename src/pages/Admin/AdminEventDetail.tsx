import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
} from "@mui/material";
import IconifyIcon from "../../components/Icon/IconifyIcon";
import MainLayout from "../../components/Layout/MainLayout";
import { Show } from "../../types";
import showsData from "../../data/shows.json";

export default function AdminEventDetail() {
  const navigate = useNavigate();
  const { showId } = useParams<{ showId: string }>();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // 초기 데이터 로드
  const shows = showsData as unknown as Show[];
  const show = shows.find((s) => s.showId === showId);

  const [formData, setFormData] = useState({
    viewCount: show?.viewCount || 0,
    popularity: show?.popularity || 0,
    bookingCount: show?.bookingCount || 0,
    ticketOpenDate: show?.ticketOpenDate || "",
    presaleOpenDate: show?.presaleOpenDate || "",
    onsaleEndDate: show?.onsaleEndDate || "",
    organizer: show?.organizer || "",
    bookingLink: show?.bookingLink || "",
  });

  if (!show) {
    return (
      <MainLayout>
        <Container maxWidth="md" sx={{ py: 2, textAlign: "center" }}>
          <Typography
            variant="h5"
            sx={{
              color: "#707070",
              mb: 3,
              fontFamily: "SUIT, LINE Seed KR, sans-serif",
            }}
          >
            공연을 찾을 수 없습니다
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/admin/events")}
            sx={{
              backgroundColor: "#4C4F7A",
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "6px",
              fontFamily: "SUIT, LINE Seed KR, sans-serif",
              "&:hover": {
                backgroundColor: "#3A3D5C",
              },
            }}
          >
            목록으로 이동
          </Button>
        </Container>
      </MainLayout>
    );
  }

  const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");

      // Firestore 업데이트
      // const { doc, updateDoc } = await import("firebase/firestore");
      // const { db } = await import("../../firebase");
      // await updateDoc(doc(db, "events", showId!), {
      //   ...formData,
      //   updatedAt: new Date(),
      // });

      console.log("💾 공연 정보 업데이트:", showId, formData);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error("업데이트 실패:", err);
      setError(err.message || "업데이트에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Box
        sx={{
          backgroundColor: "#F5F5F5",
          minHeight: "100vh",
          pt: "137px", // 105px (header) + 32px (py: 4 top)
          pb: 4,
        }}
      >
        <Container maxWidth="md">
          {/* 헤더 */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Button
              startIcon={<IconifyIcon icon="mdi:arrow-left" width={20} height={20} />}
              onClick={() => navigate("/admin/events")}
              sx={{
                color: "#707070",
                textTransform: "none",
                fontWeight: 600,
                mr: 2,
                fontFamily: "SUIT, LINE Seed KR, sans-serif",
              }}
            >
              뒤로
            </Button>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: "#232323",
                  fontFamily: "General Sans, SUIT, sans-serif",
                }}
              >
                공연 상세 정보
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#707070",
                  mt: 0.5,
                  fontFamily: "SUIT, LINE Seed KR, sans-serif",
                }}
              >
                {show.artist} - {show.tourName}
              </Typography>
            </Box>
          </Box>

          {/* 알림 */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              저장되었습니다!
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* 폼 */}
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: "1px solid #D7D7D7",
              borderRadius: "12px",
            }}
          >
            {/* 기본 정보 (읽기 전용) */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#232323",
                mb: 3,
                fontFamily: "SUIT, LINE Seed KR, sans-serif",
              }}
            >
              기본 정보
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
                mb: 4,
              }}
            >
              <TextField
                fullWidth
                label="공연 ID"
                value={show.showId}
                disabled
                size="small"
                sx={{ backgroundColor: "#F5F5F5" }}
              />
              <TextField
                fullWidth
                label="아티스트"
                value={show.artist}
                disabled
                size="small"
                sx={{ backgroundColor: "#F5F5F5" }}
              />
              <Box sx={{ gridColumn: { xs: "1", md: "1 / -1" } }}>
                <TextField
                  fullWidth
                  label="투어명"
                  value={show.tourName}
                  disabled
                  size="small"
                  sx={{ backgroundColor: "#F5F5F5" }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* 랭킹 및 인기도 */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#232323",
                mb: 3,
                fontFamily: "SUIT, LINE Seed KR, sans-serif",
              }}
            >
              랭킹 및 인기도
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                gap: 2,
                mb: 4,
              }}
            >
              <TextField
                fullWidth
                label="조회수"
                type="number"
                value={formData.viewCount}
                onChange={handleChange("viewCount")}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
              <TextField
                fullWidth
                label="인기 지수 (0-100)"
                type="number"
                value={formData.popularity}
                onChange={handleChange("popularity")}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
              <TextField
                fullWidth
                label="예매 건수"
                type="number"
                value={formData.bookingCount}
                onChange={handleChange("bookingCount")}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* 티켓 오픈 정보 */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#232323",
                mb: 3,
                fontFamily: "SUIT, LINE Seed KR, sans-serif",
              }}
            >
              티켓 오픈 정보
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 1fr" },
                gap: 2,
                mb: 4,
              }}
            >
              <TextField
                fullWidth
                label="선예매 오픈일"
                type="datetime-local"
                value={formData.presaleOpenDate}
                onChange={handleChange("presaleOpenDate")}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
              <TextField
                fullWidth
                label="티켓 오픈일"
                type="datetime-local"
                value={formData.ticketOpenDate}
                onChange={handleChange("ticketOpenDate")}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
              <TextField
                fullWidth
                label="판매 종료일"
                type="datetime-local"
                value={formData.onsaleEndDate}
                onChange={handleChange("onsaleEndDate")}
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* 추가 정보 */}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#232323",
                mb: 3,
                fontFamily: "SUIT, LINE Seed KR, sans-serif",
              }}
            >
              추가 정보
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
                mb: 4,
              }}
            >
              <TextField
                fullWidth
                label="주최사"
                value={formData.organizer}
                onChange={handleChange("organizer")}
                size="small"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
              <TextField
                fullWidth
                label="예매 링크"
                value={formData.bookingLink}
                onChange={handleChange("bookingLink")}
                size="small"
                placeholder="https://..."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "6px",
                  },
                }}
              />
            </Box>

            {/* 저장 버튼 */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate("/admin/events")}
                disabled={loading}
                sx={{
                  borderColor: "#D7D7D7",
                  color: "#707070",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  borderRadius: "6px",
                  fontFamily: "SUIT, LINE Seed KR, sans-serif",
                }}
              >
                취소
              </Button>
              <Button
                variant="contained"
                startIcon={<IconifyIcon icon="mdi:content-save" width={20} height={20} />}
                onClick={handleSave}
                disabled={loading}
                sx={{
                  backgroundColor: "#4C4F7A",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  borderRadius: "6px",
                  fontFamily: "SUIT, LINE Seed KR, sans-serif",
                  "&:hover": {
                    backgroundColor: "#3A3D5C",
                  },
                }}
              >
                {loading ? "저장 중..." : "저장"}
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    </MainLayout>
  );
}

