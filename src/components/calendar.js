// calendar.js

import React, { useState, useEffect } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays,
    isSameMonth, eachMonthOfInterval, startOfYear, endOfYear, addYears, subYears, setMonth, setYear,
    isAfter
} from 'date-fns';
import 'bootstrap/dist/css/bootstrap.min.css';
import { setMoodColor, fetchUserCalendar, fetchUserDiaries } from './api/api'; // Combined import for simplicity

const RenderSidebar = ({ isOpen, selectedDate, colors, handleMoodChange, closeSidebar }) => {
    if (!isOpen || !selectedDate) return null;

    return (
        <div className="sidebar">
            <h2>{format(selectedDate, 'yyyy-MM-dd')}</h2>
            <div className="d-flex flex-wrap">
                {colors.map((color, index) => (
                    <button
                        key={index}
                        className="btn m-1"
                        onClick={() => handleMoodChange(color)}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
            <button className="btn btn-outline-secondary mt-3" onClick={closeSidebar}>
                Close
            </button>
        </div>
    );
};

function Calendar() {
    const colors = ['#FFABAB', '#FFC3A0', '#FFF58E', '#CDE6A5', '#ACD1EA', '#9FB1D9', '#C8BFE7'];
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [moodColors, setMoodColors] = useState({});
    const [moodStickers, setMoodStickers] = useState({});
    const [today, setToday] = useState(new Date());
    const [isEditingMonth, setIsEditingMonth] = useState(false);
    const [inputMonth, setInputMonth] = useState(format(new Date(), 'M'));
    const [inputYear, setInputYear] = useState(format(new Date(), 'yyyy'));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isYearlyView, setIsYearlyView] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date());
    const [isEditingYearInYearlyView, setIsEditingYearInYearlyView] = useState(false);
    const [hoveredDate, setHoveredDate] = useState(null);
    const [diaries, setDiaries] = useState([]);
    const [hoveredSummary, setHoveredSummary] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');
        const initializeCalendar = async () => {
            try {
                const calendarData = await fetchUserCalendar(token);
                console.log('Received calendar data:', calendarData);

                if (calendarData && calendarData.isSuccess) {
                    const colorsData = {};
                    calendarData.data.forEach(entry => {
                        colorsData[format(new Date(entry.date), 'yyyy-MM-dd')] = entry.color;
                    });
                    setMoodColors(colorsData);
                } else {
                    console.error('캘린더 데이터 조회 실패:', calendarData ? calendarData.message : '응답 데이터 없음');
                }
            } catch (error) {
                console.error('Error initializing calendar data:', error.message || error);
            }
        };

        const fetchDiaries = async () => {
            try {
                const diariesData = await fetchUserDiaries(token);
                if (diariesData && diariesData.isSuccess) {
                    setDiaries(diariesData.data);
                } else {
                    console.error('일기 데이터 조회 실패:', diariesData ? diariesData.message : '응답 데이터 없음');
                }
            } catch (error) {
                console.error('Error fetching diaries:', error.message || error);
            }
        };

        if (token) {
            initializeCalendar();
            fetchDiaries();
        }
    }, []);

    useEffect(() => {
        setToday(new Date());
        const storedMoodColors = JSON.parse(localStorage.getItem('moodColors')) || {};
        const storedMoodStickers = JSON.parse(localStorage.getItem('moodStickers')) || {};
        setMoodColors(storedMoodColors);
        setMoodStickers(storedMoodStickers);
    }, []);

    useEffect(() => {
        localStorage.setItem('moodColors', JSON.stringify(moodColors));
    }, [moodColors]);

    useEffect(() => {
        localStorage.setItem('moodStickers', JSON.stringify(moodStickers));
    }, [moodStickers]);

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevYear = () => setCurrentYear(subYears(currentYear, 1));
    const nextYear = () => setCurrentYear(addYears(currentYear, 1));

    const onDateClick = (day) => {
        if (!isAfter(day, today)) {
            setSelectedDate(day);
            setIsSidebarOpen(true);
        }
    };

    const handleMoodChange = async (color, sticker) => {
        if (selectedDate) {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            setMoodColors(prevColors => ({
                ...prevColors,
                [dateStr]: color || prevColors[dateStr],
            }));
            setMoodStickers(prevStickers => ({
                ...prevStickers,
                [dateStr]: sticker || prevStickers[dateStr],
            }));
            try {
                const token = localStorage.getItem('token');
                if (!token) throw new Error('Token not provided.');
                await setMoodColor(dateStr, color, token);
                console.log('Mood saved to server');
            } catch (error) {
                console.error('Error saving mood:', error);
            }
        }
    };

    const handleMonthChange = () => {
        const newMonth = parseInt(inputMonth, 10);
        if (newMonth >= 1 && newMonth <= 12) {
            setCurrentMonth(setMonth(currentMonth, newMonth - 1));
            setIsEditingMonth(false);
        }
    };

    const handleYearChangeInYearlyView = () => {
        const newYear = parseInt(inputYear, 10);
        if (newYear >= 1900 && newYear <= today.getFullYear()) {
            setCurrentYear(setYear(currentYear, newYear));
            setIsEditingYearInYearlyView(false);
        } else {
            alert("Please enter a valid year.");
        }
    };

    const handleKeyDown = (e, callback) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            callback();
        }
    };

    const RenderHeader = ({ currentMonth, prevMonth, nextMonth }) => (
        <div className="d-flex justify-content-between align-items-center mb-3">
            <button className="btn btn-outline-primary" onClick={prevMonth}>◀</button>
            <div className="text-center">
                {isEditingMonth ? (
                    <input
                        type="number"
                        value={inputMonth}
                        onChange={(e) => setInputMonth(e.target.value)}
                        onBlur={handleMonthChange}
                        onKeyDown={(e) => handleKeyDown(e, handleMonthChange)}
                        autoFocus
                        className="form-control"
                    />
                ) : (
                    <span onClick={() => setIsEditingMonth(true)}>{format(currentMonth, 'MMMM yyyy')}</span>
                )}
            </div>
            <button className="btn btn-outline-primary" onClick={nextMonth}>▶</button>
        </div>
    );

    const RenderDays = () => {
        const dayLabels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

        return (
            <div className="row">
                {dayLabels.map((label, i) => (
                    <div className="col text-center p-2" key={i}>
                        {label}
                    </div>
                ))}
            </div>
        );
    };

    const RenderCells = ({ currentMonth, moodColors, moodStickers, onDateClick, diaries }) => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let day = startDate;

        while (day <= endDate) {
            const days = [];

            for (let i = 0; i < 7; i++) {
                const currentDay = day;
                const dayKey = format(currentDay, 'yyyy-MM-dd');
                const color = moodColors[dayKey];
                const sticker = moodStickers[dayKey];
                const diary = diaries.find(diary => diary.date === dayKey);

                days.push(
                    <div
                        className={`col text-center p-2 ${isSameMonth(currentDay, monthStart) ? '' : 'text-muted'}`}
                        key={currentDay}
                        onClick={() => onDateClick(currentDay)}
                        onMouseEnter={() => {
                            if (diary) {
                                setHoveredSummary(diary.summary);
                                setHoveredDate(dayKey);
                            }
                        }}
                        onMouseLeave={() => {
                            setHoveredSummary('');
                            setHoveredDate(null);
                        }}
                        style={{ cursor: isAfter(currentDay, today) ? 'not-allowed' : 'pointer', backgroundColor: color }}
                    >
                        <span className="date-cell">{format(currentDay, 'd')}</span>
                        {sticker && <img src={sticker} alt="Sticker" className="sticker-icon" />}
                    </div>
                );
                day = addDays(day, 1);
            }

            rows.push(
                <div className="row" key={day}>
                    {days}
                </div>
            );
        }

        return <div className="calendar-body">{rows}</div>;
    };

    const RenderYearView = ({ currentYear, prevYear, nextYear, setIsEditingYearInYearlyView, isEditingYearInYearlyView, inputYear, setInputYear, handleYearChangeInYearlyView }) => {
        const months = eachMonthOfInterval({ start: startOfYear(currentYear), end: endOfYear(currentYear) });

        return (
            <div className="yearly-view">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <button className="btn btn-outline-primary" onClick={prevYear}>◀</button>
                    <div className="text-center">
                        {isEditingYearInYearlyView ? (
                            <input
                                type="number"
                                value={inputYear}
                                onChange={(e) => setInputYear(e.target.value)}
                                onBlur={handleYearChangeInYearlyView}
                                onKeyDown={(e) => handleKeyDown(e, handleYearChangeInYearlyView)}
                                autoFocus
                                className="form-control"
                            />
                        ) : (
                            <span onClick={() => setIsEditingYearInYearlyView(true)}>{format(currentYear, 'yyyy')}</span>
                        )}
                    </div>
                    <button className="btn btn-outline-primary" onClick={nextYear}>▶</button>
                </div>
                <div className="year-view-grid">
                    {months.map((month, i) => (
                        <div key={i} className="month-view">
                            <h5>{format(month, 'MMMM yyyy')}</h5>
                            <RenderDays />
                            <RenderCells currentMonth={month} moodColors={moodColors} moodStickers={moodStickers} onDateClick={onDateClick} diaries={diaries} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="container mt-4">
            {hoveredDate && (
                <div className="hover-summary">
                    <strong>{hoveredDate}</strong>: {hoveredSummary}
                </div>
            )}
            <div className="text-center mb-4">
                <button
                    className="btn btn-outline-secondary"
                    onClick={() => setIsYearlyView(!isYearlyView)}
                >
                    {isYearlyView ? 'Switch to Monthly View' : 'Switch to Yearly View'}
                </button>
            </div>
            {isYearlyView ? (
                <RenderYearView
                    currentYear={currentYear}
                    prevYear={prevYear}
                    nextYear={nextYear}
                    setIsEditingYearInYearlyView={setIsEditingYearInYearlyView}
                    isEditingYearInYearlyView={isEditingYearInYearlyView}
                    inputYear={inputYear}
                    setInputYear={setInputYear}
                    handleYearChangeInYearlyView={handleYearChangeInYearlyView}
                />
            ) : (
                <>
                    <RenderHeader currentMonth={currentMonth} prevMonth={prevMonth} nextMonth={nextMonth} />
                    <RenderDays />
                    <RenderCells currentMonth={currentMonth} moodColors={moodColors} moodStickers={moodStickers} onDateClick={onDateClick} diaries={diaries} />
                </>
            )}
            <RenderSidebar
                isOpen={isSidebarOpen}
                selectedDate={selectedDate}
                colors={colors}
                handleMoodChange={handleMoodChange}
                closeSidebar={() => setIsSidebarOpen(false)}
            />
        </div>
    );
}

export default Calendar;
