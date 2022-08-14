import React, { useEffect, useState, useCallback, useRef } from "react";
import { Box } from "@mui/material";
import moment from "moment";

export default function App() {
  const [state, setState] = useState({
    start_month: "2020-10",
    end_month: "2021-02",
    block_size: 30,
    block_number: 0,
    calendars: []
  });

  const [windowSize, setWindwoSize] = useState({
    inner_width: "",
    inner_height: "",
    task_width: "",
    task_height: ""
  });

  /**
   * 開始月と終了月の間の月数分のカレンダーを作成する
   */
  const getCalendar = useCallback(() => {
    let block_number = 0;
    let days;
    let start_month = moment(state.start_month);
    let end_month = moment(state.end_month);
    let between_month = end_month.diff(start_month, "months");
    let calendars = [];
    for (let i = 0; i <= between_month; i++) {
      days = getDays(
        start_month.year(),
        start_month.format("MM"),
        block_number
      );

      calendars.push({
        date: start_month.format("YYYY年MM月"),
        year: start_month.year(),
        month: start_month.month(), //month(), 0,1..11と表示
        start_block_number: block_number,
        calendar: days.length,
        days: days
      });

      start_month.add(1, "months");
      block_number = days[days.length - 1].block_number;
      block_number++;
    }

    setState((prev) => ({
      ...prev,
      calendars: calendars
    }));

    return block_number;
  }, [state.start_month, state.end_month]);

  const getWindowSize = () => {
    setWindwoSize({
      inner_width: window.innerWidth,
      inner_height: window.innerHeight,
      task_width: task.current.offsetWidth,
      task_height: task.current.offsetHeight
    });
  };

  useEffect(() => {
    getCalendar();
    getWindowSize();
    window.addEventListener("resize", getWindowSize);
  }, [getCalendar]);

  const task = useRef();

  /**
   * カレンダー領域の幅を計算する
   * カレンダーがブラウザの右端まで表示され、ウィンドウサイズを変更しても右端にぴったりとくっついたままで表示
   */
  const calendarViewWidth = () =>
    windowSize.inner_width - windowSize.task_width;

  /**
   * タスクバー領域の高さを計算
   * ウィンドウの高さからヘッダー領域(ガントチャートと表示)、タスクタイトル領域、下部のスクロールバーの高さを引く
   */
  const calendarViewHeight = () =>
    windowSize.inner_height - windowSize.task_height - 48 - 20;

  return (
    <Box id="app">
      <Box
        id="gantt-header"
        sx={{
          height: "3rem",
          p: "0.5rem",
          display: "flex",
          alignItems: "center"
        }}
      >
        <Box
          component="h1"
          sx={{
            fontSize: "1.25rem",
            lineHeight: "1.75rem",
            fontWeight: "700"
          }}
        >
          ガントチャート
        </Box>
      </Box>
      <Box id="gantt-content" sx={{ display: "flex" }}>
        <Box id="gantt-task">
          <Box
            id="gantt-task-title"
            ref={task}
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#059669",
              height: "5rem",
              color: "white"
            }}
          >
            <Box
              sx={{
                borderTopWidth: "1px",
                borderRightWidth: "1px",
                borderBottomWidth: "1px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.75rem",
                lineHeight: "1rem",
                width: "12rem",
                height: "100%"
              }}
            >
              タスク
            </Box>
            <Box
              sx={{
                borderTopWidth: "1px",
                borderRightWidth: "1px",
                borderBottomWidth: "1px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.75rem",
                lineHeight: "1rem",
                width: "6rem",
                height: "100%"
              }}
            >
              開始日
            </Box>
            <Box
              sx={{
                borderTopWidth: "1px",
                borderRightWidth: "1px",
                borderBottomWidth: "1px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.75rem",
                lineHeight: "1rem",
                width: "6rem",
                height: "100%"
              }}
            >
              完了期限日
            </Box>
            <Box
              sx={{
                borderTopWidth: "1px",
                borderRightWidth: "1px",
                borderBottomWidth: "1px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.75rem",
                lineHeight: "1rem",
                width: "4rem",
                height: "100%"
              }}
            >
              担当
            </Box>
            <Box
              sx={{
                borderTopWidth: "1px",
                borderRightWidth: "1px",
                borderBottomWidth: "1px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "700",
                fontSize: "0.75rem",
                lineHeight: "1rem",
                width: "3rem",
                height: "100%"
              }}
            >
              進捗
            </Box>
          </Box>
        </Box>
        <Box
          id="gantt-calendar"
          sx={{ overflowX: "scroll", width: `${calendarViewWidth()}px` }}
        >
          <Box id="gantt-date" sx={{ height: "5rem" }}>
            <Box
              id="gantt-year-month"
              sx={{ position: "relative", height: "2rem" }}
            >
              {state.calendars?.map((calendar, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: "#4338CA",
                    color: "#ffffff",
                    borderTopWidth: "1px",
                    borderRightWidth: "1px",
                    borderBottomWidth: "1px",
                    height: "2rem",
                    position: "absolute",
                    fontWeight: "700",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: `${calendar.calendar * state.block_size}px`,
                    left: `${calendar.start_block_number * state.block_size}px`
                  }}
                >
                  {calendar.date}
                </Box>
              ))}
            </Box>
            <Box id="gantt-day" sx={{ position: "relative", height: "3rem" }}>
              {state.calendars?.map((calendar, index) => (
                <Box key={index}>
                  {calendar.days?.map((day, index2) => (
                    <Box key={index2}>
                      <Box
                        sx={{
                          borderRightWidth: "1px",
                          height: "3rem",
                          position: "absolute",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "column",
                          fontWeight: "700",
                          fontSize: "0.75rem",
                          lineHeight: "1rem",
                          width: `${state.block_size}px`,
                          left: `${day.block_number * state.block_size}px`,
                          backgroundColor:
                            (day.dayOfWeek === "土" && "#DBEAFE") ||
                            (day.dayOfWeek === "日" && "#FEE2E2")
                        }}
                      >
                        <Box component="span">{day.day}</Box>
                        <Box component="span">{day.dayOfWeek}</Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
            <Box id="gantt-height" sx={{ position: "relative" }}>
              {state.calendars?.map((calendar, index) => (
                <Box key={index}>
                  {calendar.days?.map((day, index2) => (
                    <Box key={index2}>
                      <Box
                        sx={{
                          borderRightWidth: "1px",
                          borderBottomWidth: "1px",
                          position: "absolute",
                          width: `${state.block_size}px`,
                          left: `${day.block_number * state.block_size}px`,
                          height: `${calendarViewHeight()}px`,
                          backgroundColor:
                            (day.dayOfWeek === "土" && "#DBEAFE") ||
                            (day.dayOfWeek === "日" && "#FEE2E2")
                        }}
                      ></Box>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>
      <Box
        id="gantt-bar-area"
        sx={{
          position: "relative",
          width: `${calendarViewWidth()}px`,
          height: `${calendarViewHeight()}px`
        }}
      ></Box>
    </Box>
  );
}

/**
 * 各月の日付と曜日を持った配列を作成する
 */
function getDays(year, month, block_number) {
  const dayOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
  let days = [];
  let date = moment(`${year}-${month}-01`);
  let num = date.daysInMonth();
  for (let i = 0; i < num; i++) {
    days.push({
      day: date.date(),
      dayOfWeek: dayOfWeek[date.day()],
      block_number
    });
    date.add(1, "day");
    block_number++;
  }
  return days;
}
