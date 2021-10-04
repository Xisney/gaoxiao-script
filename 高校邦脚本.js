// ==UserScript==
// @name         高校邦一键完成，自动静音播放
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Yusheng Xie
// @match        https://*.class.gaoxiaobang.com/class/*/unit/*/chapter/*
// @grant        none
// ==/UserScript==

;(function () {
  'use strict'
  const executeUntilSuccess = (target, span = 500) => {
    if (typeof target !== 'function') return

    try {
      target()
    } catch (e) {
      setTimeout(() => {
        executeUntilSuccess(target, span)
      }, span)
    }
  }

  const listen = window.addEventListener
  window.addEventListener = (name, callback, options) => {
    if (name === 'blur') return
    listen(name, callback, options)
  }

  window.addEventListener('load', () => {
    // 避免jQuery不存在，导致无限报错，引发内存泄漏
    if (typeof jQuery !== 'function') {
      const script = document.createElement('script')
      script.src =
        'https://cdn.bootcdn.net/ajax/libs/jquery/3.6.0/jquery.min.js'
      document.head.appendChild(script)
    }
  })

  const finishByClick = () => {
    if (typeof jQuery !== 'funtion') {
      console.error('no jquery')
    }
    const video = $('#video_player_html5_api')[0]
    const duration = parseInt(video.duration)

    const pathArr = location.pathname.split('/')
    const classId = pathArr[2]
    const chapterId = pathArr[6]

    const ct = new Date().getTime()
    const infoUrl = `https://cqupt.class.gaoxiaobang.com/class/${classId}/chapter/${chapterId}/api?${ct}`

    $.post(infoUrl, res => {
      const mh = res.userRecord.maxViewTime ? res.userRecord.maxViewTime : 0
      const logUrl = `https://cqupt.class.gaoxiaobang.com/log/video/${chapterId}/${classId}/api?${new Date().getTime()}`
      $.post(
        logUrl,
        {
          rl: location.href,
          data: JSON.stringify([
            {
              state: 'listening',
              level: 2,
              ch: duration,
              mh,
              ct,
            },
          ]),
        },
        res => {
          if (res === 'success') {
            location.reload()
          }
        }
      )
    })
  }

  const inVideoPage = () => {
    if (location.host.startsWith('imooc')) return

    if (typeof jQuery !== 'function') {
      console.error('no jquery')
    }

    const video = $('#video_player_html5_api')[0]
    video.volume = 0
    video.play()

    answerQuestions()

    const btn = document.createElement('button')
    $(btn).css({
      position: 'fixed',
      right: '50px',
      top: '200px',
      transform: 'translateY(-50%)',
      'z-index': '10',
    })
    btn.innerHTML = '一键完成'
    btn.addEventListener('click', finishByClick)
    $('body').append(btn)
  }

  const answerQuestions = () => {
    const observer = new MutationObserver(records => {
      for (let r of records) {
        if (r.type === 'childList') {
          const quizItems = $('.gxb-video-quiz-body .question-item')

          if (quizItems.length === 0) return

          quizItems.each(function (i) {
            const res = $(this)
              .children('.correctAnswer')[0]
              .getAttribute('data')
              .split('')
              .map(char => {
                return char.codePointAt(0) - 'A'.codePointAt(0)
              })

            const answers = $(this)
              .find('.answer-wap .answer')
              .children('i[answer_id]')
            res.forEach(value => {
              answers[value].click()
            })

            if (i !== quizItems.length - 1) {
              $('.gxb-video-quiz .gxb-icon-next').click()
              console.log('cccsfa');
            }
          })

          $('.gxb-video-quiz-footer .gxb-btn_.submit').click()
          setTimeout(()=>{
            // 使得用户可感知答题结果，也确保dom更新完成
            $('.gxb-video-quiz-footer .gxb-btn_.player').click()
          },500)
        }
      }
    })

    const target = $('.player-video')[0]
    observer.observe(target, {
      childList: true,
    })
  }

  executeUntilSuccess(() => {
    inVideoPage()
  })
})()
