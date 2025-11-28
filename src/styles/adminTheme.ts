/**
 * 통일된 관리자 페이지 디자인 시스템
 * 모든 Admin 페이지에서 일관된 스타일을 사용하기 위한 테마
 */

export const adminTheme = {
  // 색상
  colors: {
    primary: {
      gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      main: "#667eea",
      dark: "#764ba2",
    },
    text: {
      primary: "#232323",
      secondary: "#666",
      muted: "#999",
    },
    background: {
      main: "#F5F5F5",
      paper: "#fff",
    },
    border: {
      light: "#e0e0e0",
      main: "#d0d0d0",
    },
    status: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#667eea",
    },
  },

  // 간격
  spacing: {
    containerTop: 3, // mt: 3
    headerBottom: 3, // mb: 3
    sectionGap: 3,
  },

  // 타이포그래피
  typography: {
    title: {
      fontSize: "h4",
      fontWeight: 800,
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      backgroundClip: "text",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      fontFamily: "General Sans, SUIT, sans-serif",
    },
    subtitle: {
      fontSize: 14,
      color: "#999",
      fontFamily: "SUIT, LINE Seed KR, sans-serif",
    },
  },

  // 컴포넌트 스타일
  components: {
    paper: {
      border: "1px solid #e0e0e0",
      borderRadius: 3,
      backgroundColor: "#fff",
    },
    button: {
      primary: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: 2,
        textTransform: "none",
        fontWeight: 600,
        px: 3,
        py: 1.2,
        boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
        "&:hover": {
          background: "linear-gradient(135deg, #5568d3 0%, #65398b 100%)",
          boxShadow: "0 6px 16px rgba(102, 126, 234, 0.4)",
        },
      },
    },
    searchField: {
      borderRadius: 3,
      backgroundColor: "#fafafa",
      "&:hover": {
        backgroundColor: "#f5f5f5",
      },
      "&.Mui-focused": {
        backgroundColor: "#fff",
        "& fieldset": {
          borderColor: "#667eea",
        },
      },
    },
    chip: {
      primary: {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "#fff",
        fontWeight: 600,
        fontSize: 11,
        height: 24,
        borderRadius: 2,
      },
    },
    table: {
      header: {
        backgroundColor: "#fafafa",
        fontWeight: 700,
        color: "#333",
      },
      row: {
        "&:hover": {
          backgroundColor: "rgba(102, 126, 234, 0.03)",
        },
      },
    },
  },

  // 레이아웃
  layout: {
    container: {
      pt: 0,
      pb: 4,
      backgroundColor: "#F5F5F5",
      minHeight: "100vh",
    },
  },
};

export default adminTheme;

