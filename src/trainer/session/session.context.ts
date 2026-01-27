export function resetSessionContext(context: SessionContext) {
  context.state = 'active'
  context.sessionId = crypto.randomUUID()

  context.startAt = Date.now()
  context.lastAnswerAt = 0

  context.totalCount = 0
  context.correctCount = 0
  context.wrongCount = 0

  context.answerTimes = []
  context.details = []
}

