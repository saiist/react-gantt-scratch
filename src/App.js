import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { Box } from "@mui/material";
import moment from "moment";

export default function App() {
  const [state, setState] = useState({
    start_month: "2022-04",
    end_month: "2023-02",
    block_size: 30,
    block_number: 0,
    calendars: [],
    today: moment(),
  });

  const [tasksState, setTasksState] = useState(getTasks());

  const [windowSizeState, setWindwoSizeState] = useState({
    inner_width: "",
    inner_height: "",
    task_width: "",
    task_height: "",
    position_id: 0,
  });

  const [taskBarState, setTaskBarState] = useState({
    dragging: false,
    pageX: "",
    element: "",
    left: "",
    task_id: "",
    width: "",
    leftResizing: false,
    rightResizing: false,
  });

  const [dragTaskState, setDragTaskState] = useState({
    cat: "",
    id: null,
    category_id: null,
    name: "",
    start_date: "",
    end_date: "",
    incharge_user: "",
    percentage: null,
  })

  const taskRef = useRef(null);
  const calendarRef = useRef(null);

  const tasksStateRef = useRef(null);
  tasksStateRef.current = tasksState;
  const windowSizeStateRef = useRef(null);
  windowSizeStateRef.current = windowSizeState;
  const taskBarStateRef = useRef(null);
  taskBarStateRef.current = taskBarState;

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
        days: days,
      });

      start_month.add(1, "months");
      block_number = days[days.length - 1].block_number;
      block_number++;
    }

    setState((prev) => ({
      ...prev,
      calendars: calendars,
    }));

    return block_number;
  }, [state.start_month, state.end_month]);

  const getWindowSize = useCallback(() => {
    setWindwoSizeState({
      ...windowSizeStateRef.current,
      inner_width: window.innerWidth,
      inner_height: window.innerHeight,
      task_width: taskRef.current.offsetWidth,
      task_height: taskRef.current.offsetHeight,
    });
  }, []);

  /**
   * カレンダー領域の幅を計算する
   * カレンダーがブラウザの右端まで表示され、ウィンドウサイズを変更しても右端にぴったりとくっついたままで表示
   */
  const calendarViewWidth = useCallback(() => {
    return windowSizeState.inner_width - windowSizeState.task_width;
  }, [windowSizeState.inner_width, windowSizeState.task_width]);

  const lists = useMemo(() => {
    let lists = [];
    categories.forEach((category) => {
      lists.push({ cat: "category", ...category });
      tasksState.forEach((task) => {
        if (task.category_id === category.id) {
          lists.push({ cat: "task", ...task });
        }
      });
    });
    console.log({ lists })
    return lists;
  }, [tasksState]);

  /**
   * タスクバー領域の高さを計算
   * ウィンドウの高さからヘッダー領域(ガントチャートと表示)、タスクタイトル領域、下部のスクロールバーの高さを引く
   */
  const calendarViewHeight = useCallback(() => {
    return windowSizeState.inner_height - windowSizeState.task_height - 48 - 20;
  }, [windowSizeState.inner_height, windowSizeState.task_height]);

  const windowSizeCheck = useCallback(
    (event) => {
      let height = lists.length - windowSizeStateRef.current.position_id;
      let position_id = windowSizeStateRef.current.position_id;
      if (event.deltaY > 0 && height * 40 > calendarViewHeight()) {
        position_id++;
      } else if (
        event.deltaY < 0 &&
        windowSizeStateRef.current.position_id !== 0
      ) {
        position_id--;
      }

      setWindwoSizeState({
        ...windowSizeStateRef.current,
        position_id: position_id,
      });
    },
    [calendarViewHeight, lists.length]
  );

  // mousemove イベント
  // マウスの移動に合わせてタスクバーを移動させる
  const startDrag = useCallback((event) => {
    if (taskBarStateRef.current.dragging) {
      const diff = taskBarStateRef.current.pageX - event.pageX;
      const element = taskBarStateRef.current.element;
      element.style.left = `${Number(taskBarStateRef.current.left.replace("px", "")) - diff
        }px`;

      // クリックされているタスクバーの座標から、マウスの現在地の座標の差分の距離を適用する
      setTaskBarState({
        ...taskBarStateRef.current,
        element: element,
      });
    }
  }, []);

  // mouseup イベント
  // マウスのクリックを外した際にマウスの移動との同期を解除する（ドラッグ終了時イベント）
  const stopDrag = useCallback(
    (event) => {
      if (taskBarStateRef.current.dragging) {
        // タスクバーのドラッグ終了時

        // block_size で割ることで移動が何日分進んだかを計算する
        let diff = taskBarStateRef.current.pageX - event.pageX;
        let days = Math.ceil(diff / state.block_size);
        if (days !== 0) {
          // タスクバーの移動に合わせて開始日、終了日を更新する
          setTasksState(
            tasksStateRef.current.map((task) => {
              if (taskBarStateRef.current.task_id === task.id) {
                let start_date = moment(task.start_date).add(-days, "days");
                let end_date = moment(task.end_date).add(-days, "days");
                return {
                  ...task,
                  start_date: start_date.format("YYYY-MM-DD"),
                  end_date: end_date.format("YYYY-MM-DD"),
                };
              } else {
                return task;
              }
            })
          );
        } else {
          // 移動幅が小さい場合は days = 0 となる
          const element = taskBarStateRef.current.element;
          element.style.left = `${taskBarStateRef.current.left.replace(
            "px",
            ""
          )}px`;

          // 元の位置に戻す
          setTaskBarState({
            ...taskBarStateRef.current,
            element: element,
          });
        }
      }
      if (taskBarStateRef.current.leftResizing) {
        // 左方向へのリサイズ終了時

        // block_size で割ることで何日分リサイズがあったかを計算する
        let diff = taskBarStateRef.current.pageX - event.pageX;
        let days = Math.ceil(diff / state.block_size);
        if (days !== 0) {
          // 拡大リサイズする場合
          setTasksState(
            tasksStateRef.current.map((task) => {
              if (taskBarStateRef.current.task_id === task.id) {
                let start_date = moment(task.start_date).add(-days, "days");
                let end_date = moment(task.end_date);
                if (end_date.diff(start_date, "days") <= 0) {
                  // 開始日が終了日より大きい場合はあり得ないので、同日を設定する
                  return {
                    ...task,
                    start_date: end_date.format("YYYY-MM-DD"),
                  };
                } else {
                  return {
                    ...task,
                    start_date: start_date.format("YYYY-MM-DD"),
                  };
                }
              } else {
                return task;
              }
            })
          );
        } else {
          const element = taskBarStateRef.current.element;
          element.style.width = taskBarStateRef.current.width;
          element.style.left = `${taskBarStateRef.current.left.replace(
            "px",
            ""
          )}px`;

          // リサイズ幅が小さい場合は元の位置に戻す
          setTaskBarState({
            ...taskBarStateRef.current,
            element: element,
          });
        }
      }
      if (taskBarStateRef.current.rightResizing) {
        // 右方向へのリサイズ終了時
        let diff = taskBarStateRef.current.pageX - event.pageX;
        let days = Math.ceil(diff / state.block_size);
        if (days === 1) {
          // 拡大リサイズする場合（リサイズ幅が小さい場合）
          const element = taskBarStateRef.current.element;
          element.style.width = `${Number(
            taskBarStateRef.current.width.replace("px", "")
          )}px`;

          // リサイズ幅が小さい場合は元の位置に戻す
          setTaskBarState({
            ...taskBarStateRef.current,
            element: element,
          });
        } else if (days <= 2) {
          // 拡大リサイズする場合
          days--;
          setTasksState(
            tasksStateRef.current.map((task) => {
              if (taskBarStateRef.current.task_id === task.id) {
                let end_date = moment(task.end_date).add(-days, "days");
                return {
                  ...task,
                  end_date: end_date.format("YYYY-MM-DD"),
                };
              } else {
                return task;
              }
            })
          );
        } else {
          // 縮小リサイズする場合
          setTasksState(
            tasksStateRef.current.map((task) => {
              if (taskBarStateRef.current.task_id === task.id) {
                let start_date = moment(task.start_date);
                let end_date = moment(task.end_date).add(-days, "days");
                if (end_date.diff(start_date, "days") < 0) {
                  // 開始日が終了日より大きい場合はあり得ないので、同日を設定する
                  return {
                    ...task,
                    end_date: start_date.format("YYYY-MM-DD"),
                  };
                } else {
                  return {
                    ...task,
                    end_date: end_date.format("YYYY-MM-DD"),
                  };
                }
              } else {
                return task;
              }
            })
          );
        }
      }

      setTaskBarState({
        ...taskBarStateRef.current,
        dragging: false,
        leftResizing: false,
        rightResizing: false,
      });
    },
    [state.block_size]
  );

  const mouseResize = useCallback(
    (event) => {
      if (taskBarStateRef.current.leftResizing) {
        let diff = taskBarStateRef.current.pageX - event.pageX;

        if (
          Number(taskBarStateRef.current.width.replace("px", "")) + diff >
          state.block_size
        ) {

          // タスクバーの幅が一日分よりも小さくならなければ、リサイズする
          const element = taskBarStateRef.current.element;
          element.style.width = `${Number(taskBarStateRef.current.width.replace("px", "")) + diff
            }px`;
          element.style.left = `${taskBarStateRef.current.left.replace("px", "") - diff
            }px`;
          setTaskBarState({
            ...taskBarStateRef.current,
            element: element,
          });
        }
      }
      if (taskBarStateRef.current.rightResizing) {
        let diff = taskBarStateRef.current.pageX - event.pageX;
        if (
          Number(taskBarStateRef.current.width.replace("px", "")) - diff >
          state.block_size
        ) {
          const element = taskBarStateRef.current.element;
          element.style.width = `${Number(taskBarStateRef.current.width.replace("px", "")) - diff
            }px`;
          setTaskBarState({
            ...taskBarStateRef.current,
            element: element,
          });
        }
      }
    },
    [state.block_size]
  );

  /**
   * 本日の場所を設定するためにはstart_monthの1日から本日までに何日あるかを計算
   * 日数にblock_sizeをかけることでカレンダー領域の左端からの距離を算出する
   */
  const scrollDistance = useCallback(() => {
    const start_date = moment(state.start_month);
    const between_days = state.today.diff(start_date, "days");
    return (between_days + 1) * state.block_size - calendarViewWidth() / 2;
  }, [calendarViewWidth, state.today, state.start_month, state.block_size]);

  const todayPosition = useCallback(() => {
    calendarRef.current.scrollLeft = scrollDistance();
  }, [scrollDistance]);

  useEffect(() => {
    getCalendar();
    getWindowSize();
    todayPosition();
    window.addEventListener("resize", getWindowSize);
    window.addEventListener("wheel", windowSizeCheck);
    window.addEventListener("mousemove", startDrag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("mousemove", mouseResize);
  }, [
    getCalendar,
    getWindowSize,
    startDrag,
    stopDrag,
    todayPosition,
    windowSizeCheck,
    mouseResize,
  ]);

  const displayTasks = useMemo(() => {
    let display_task_number = Math.floor(calendarViewHeight() / 40);
    return lists.slice(
      windowSizeState.position_id,
      windowSizeState.position_id + display_task_number
    );
  }, [calendarViewHeight, lists, windowSizeState.position_id]);

  const taskBars = useMemo(() => {
    let start_date = moment(state.start_month);
    let top = 10; // 各タスクバーに確保された高さの領域(h-10=2.5rem=40px)の上から10pxからタスクバーを表示させるために指定
    let left;
    let between;
    let start;
    let style;
    return displayTasks.map((task) => {
      style = {};
      if (task.cat === "task") {
        let date_from = moment(task.start_date);
        let date_to = moment(task.end_date);
        between = date_to.diff(date_from, "days");
        between++;
        start = date_from.diff(start_date, "days");
        left = start * state.block_size;
        style = {
          top: `${top}px`,
          left: `${left}px`,
          width: `${state.block_size * between}px`,
        };
      }
      // listsをループする毎にtopに40pxを足して、各タスクバーが確保した高さの10px下からタスクバーを表示する
      top = top + 40;
      return {
        style,
        task,
      };
    });
  }, [displayTasks, state.block_size, state.start_month]);

  const handleMouseDownTask = useCallback(
    (event, task) => {
      setTaskBarState({
        ...taskBarState,
        dragging: true,
        pageX: event.pageX,
        element: event.target,
        left: event.target.style.left,
        task_id: task.id,
      });
    },
    [taskBarState]
  );

  const handleMouseDownResize = useCallback(
    (event, task, direction) => {
      event.stopPropagation();
      setTaskBarState({
        ...taskBarState,
        leftResizing: direction === "left",
        rightResizing: direction === "right",
        pageX: event.pageX,
        width: event.target.parentElement.style.width,
        left: event.target.parentElement.style.left,
        element: event.target.parentElement,
        task_id: task.id,
      });
    },
    [taskBarState]
  );

  const handleDragStartTask = useCallback((event, dragTask) => {
    setDragTaskState(dragTask)
  }, [])

  const handleDragTaskOver = useCallback((event, overTask) => {
    event.preventDefault();

    if (dragTaskState.cat !== 'category') {
      if (overTask.cat === 'category') {
        setTasksState(
          tasksState.map((task) => {
            if (task.id === dragTaskState.id) {
              return { ...task, category_id: overTask.id }
            } else {
              return task;
            }
          })
        )
      } else {
        let deleteIndex;
        let addIndex;
        if (overTask.id !== dragTaskState.id) {
          tasksState.map((task, index) => { if (task.id === dragTaskState.id) deleteIndex = index })
          tasksState.map((task, index) => { if (task.id === overTask.id) addIndex = index })

          // タスクの入れ替え
          // ドラッグしたタスクを元の場所から削除し、ドラッグオーバーしたタスクがいた、タスクリストの場所に挿入する
          tasksState.splice(deleteIndex, 1)
          dragTaskState.category_id = overTask.category_id
          tasksState.splice(addIndex, 0, dragTaskState)

          setTasksState(tasksState.map((s) => s))
        }
      }
    }
  }, [dragTaskState, tasksState])

  return (
    <Box id="app">
      <Box
        id="gantt-header"
        sx={{
          height: "3rem",
          p: "0.5rem",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          component="h1"
          sx={{
            fontSize: "1.25rem",
            lineHeight: "1.75rem",
            fontWeight: "700",
          }}
        >
          ガントチャート
        </Box>
      </Box>
      <Box id="gantt-content" sx={{ display: "flex" }}>
        <Box id="gantt-task">
          <Box
            id="gantt-task-title"
            ref={taskRef}
            sx={{
              display: "flex",
              alignItems: "center",
              backgroundColor: "#059669",
              height: "5rem",
              color: "white",
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
                height: "100%",
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
                height: "100%",
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
                height: "100%",
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
                height: "100%",
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
                height: "100%",
              }}
            >
              進捗
            </Box>
          </Box>
          <Box
            id="gantt-task-list"
            sx={{ overflowY: "hidden", height: `${calendarViewHeight()}px` }}
          >
            {displayTasks.map((task, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  height: "2.5rem",
                  borderBottomWidth: "1px",
                }}
                draggable={true}
                onDragStart={(e) => handleDragStartTask(e, task)}
                onDragOver={(e) => handleDragTaskOver(e, task)}
              >
                {task.cat === "category" ? (
                  // カテゴリ
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      fontWeight: "700",
                      width: "100%",
                      fontSize: "0.875rem",
                      lineHeight: "1.25rem",
                      paddingLeft: "0.5rem",
                    }}
                  >
                    {task.name}
                  </Box>
                ) : (
                  // タスク
                  <Box
                    sx={{
                      borderRightWidth: "1px",
                      display: "flex",
                      alignItems: "center",
                      fontWeight: "700",
                      width: "12rem",
                      fontSize: "0.875rem",
                      lineHeight: "1.25rem",
                      paddingLeft: "1rem",
                    }}
                  >
                    {task.name}
                  </Box>
                )}

                <Box
                  sx={{
                    borderRightWidth: "1px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "6rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                  }}
                >
                  {task.start_date}
                </Box>
                <Box
                  sx={{
                    borderRightWidth: "1px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "6rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                  }}
                >
                  {task.end_date}
                </Box>
                <Box
                  sx={{
                    borderRightWidth: "1px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "4rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                  }}
                >
                  {task.incharge_user}
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "3rem",
                    fontSize: "0.875rem",
                    lineHeight: "1.25rem",
                  }}
                >
                  {task.percentage}%
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
        <Box
          id="gantt-calendar"
          sx={{
            overflowX: "scroll",
            overflowY: "hidden",
            width: `${calendarViewWidth()}px`,
          }}
          ref={calendarRef}
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
                    left: `${calendar.start_block_number * state.block_size}px`,
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
                    <Box
                      key={index2}
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
                          (calendar.year === state.today.year() &&
                            calendar.month === state.today.month() &&
                            day.day === state.today.date() &&
                            "#DC2626") ||
                          (day.dayOfWeek === "土" && "#DBEAFE") ||
                          (day.dayOfWeek === "日" && "#FEE2E2"),
                        color:
                          calendar.year === state.today.year() &&
                          calendar.month === state.today.month() &&
                          day.day === state.today.date() &&
                          "#ffffff",
                      }}
                    >
                      <Box component="span">{day.day}</Box>
                      <Box component="span">{day.dayOfWeek}</Box>
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
            <Box id="gantt-height" sx={{ position: "relative" }}>
              {state.calendars?.map((calendar, index) => (
                <Box key={index}>
                  {calendar.days?.map((day, index2) => (
                    <Box
                      key={index2}
                      sx={{
                        borderRightWidth: "1px",
                        borderBottomWidth: "1px",
                        position: "absolute",
                        width: `${state.block_size}px`,
                        left: `${day.block_number * state.block_size}px`,
                        height: `${calendarViewHeight()}px`,
                        backgroundColor:
                          (day.dayOfWeek === "土" && "#DBEAFE") ||
                          (day.dayOfWeek === "日" && "#FEE2E2"),
                      }}
                    ></Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
          <Box
            id="gantt-bar-area"
            sx={{
              position: "relative",
              width: `${calendarViewWidth()}px`,
              height: `${calendarViewHeight()}px`,
            }}
          >
            {taskBars.map((bar, index) => (
              <Box key={index}>
                {bar.task.cat === "task" && (
                  <Box
                    key={index}
                    style={bar.style}
                    sx={{
                      borderRadius: "0.5rem",
                      position: "absolute",
                      height: "1.25rem",
                      backgroundColor: "#FEF3C7",
                    }}
                    onMouseDown={(e) => handleMouseDownTask(e, bar.task)}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        height: "100%",
                        pointerEvents: "none",
                      }}
                    ></Box>
                    <Box
                      sx={{
                        position: "absolute",
                        width: "0.5rem",
                        height: "0.5rem",
                        backgroundColor: "#D1D5DB",
                        borderWidth: "1px",
                        borderColor: "#000000",
                        top: "6px",
                        left: "-6px",
                        cursor: "col-resize",
                      }}
                      onMouseDown={(e) =>
                        handleMouseDownResize(e, bar.task, "left")
                      }
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        width: "0.5rem",
                        height: "0.5rem",
                        backgroundColor: "#D1D5DB",
                        borderWidth: "1px",
                        borderColor: "#000000",
                        top: "6px",
                        right: "-6px",
                        cursor: "col-resize",
                      }}
                      onMouseDown={(e) =>
                        handleMouseDownResize(e, bar.task, "right")
                      }
                    />
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
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
      block_number,
    });
    date.add(1, "day");
    block_number++;
  }
  return days;
}

const categories = [
  {
    id: 1,
    name: "テストA",
    collapsed: false,
  },
  {
    id: 2,
    name: "テストB",
    collapsed: false,
  },
];

const getTasks = () => [
  {
    id: 1,
    category_id: 1,
    name: "テスト1",
    start_date: "2022-11-18",
    end_date: "2022-11-20",
    incharge_user: "鈴木",
    percentage: 100,
  },
  {
    id: 2,
    category_id: 1,
    name: "テスト2",
    start_date: "2022-11-19",
    end_date: "2022-11-23",
    incharge_user: "佐藤",
    percentage: 90,
  },
  {
    id: 3,
    category_id: 1,
    name: "テスト3",
    start_date: "2022-11-19",
    end_date: "2022-12-04",
    incharge_user: "鈴木",
    percentage: 40,
  },
  {
    id: 4,
    category_id: 1,
    name: "テスト4",
    start_date: "2022-11-21",
    end_date: "2022-11-30",
    incharge_user: "山下",
    percentage: 60,
  },
  {
    id: 5,
    category_id: 1,
    name: "テスト5",
    start_date: "2022-11-25",
    end_date: "2022-12-04",
    incharge_user: "佐藤",
    percentage: 5,
  },
  {
    id: 6,
    category_id: 2,
    name: "テスト6",
    start_date: "2022-11-28",
    end_date: "2022-12-08",
    incharge_user: "佐藤",
    percentage: 0,
  },
];
