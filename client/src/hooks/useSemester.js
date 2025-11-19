const useSemester = () => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // getMonth()는 0~11을 반환하므로 +1
    const currentSemesterNum = currentMonth <= 6 ? 1 : 2; // 1~6월은 1학기, 7~12월은 2학기
    const semester = `${currentYear}-${String(currentSemesterNum).padStart(2, '0')}`;
    return semester;
}

export default useSemester;