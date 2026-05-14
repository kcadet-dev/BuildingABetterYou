import { useBudgetApp } from '../context/BudgetAppContext.jsx';
import {
  expenseCategoryOptions,
  formatCurrency,
  formatDateInput,
  formatExpenseCurrency,
  formatLongDate,
  formatSignedCurrency,
  frequencyOptions,
  getCalendarPreviewItems,
  getCalendarWeekRange,
  getExpensePaymentKey,
  getFrequencyLabel,
  getIncomePaymentKey,
  isDateInRange,
  isPaymentConfirmed,
  isSameDay,
  parseLocalDate,
} from '../lib/budgetHelpers.js';

export function PlannerPage() {
  return (
    <section className="workspace-grid">
      <PlannerFormPanel />
      <div className="calendar-column">
        <CalendarPanel />
        <SelectionDetails />
      </div>
    </section>
  );
}

function PlannerFormPanel() {
  const { activePlannerTab, setActivePlannerTab } = useBudgetApp();

  return (
    <section className="income-panel" aria-labelledby="income-heading">
      <div className="planner-tabs" aria-label="Planner sections">
        <button
          type="button"
          className={activePlannerTab === 'income' ? 'active' : ''}
          onClick={() => setActivePlannerTab('income')}
        >
          Income
        </button>
        <button
          type="button"
          className={activePlannerTab === 'expenses' ? 'active' : ''}
          onClick={() => setActivePlannerTab('expenses')}
        >
          Expenses
        </button>
      </div>

      {activePlannerTab === 'income' ? <IncomePlanner /> : <ExpensePlanner />}
    </section>
  );
}

function IncomePlanner() {
  const {
    accountStartMonth,
    editingIncomeSourceId,
    estimatedGrossPay,
    estimatedNetPay,
    handleDeleteIncomeSource,
    handleEditIncomeSource,
    handleEstimateToggle,
    handleIncomeChange,
    handleIncomeSubmit,
    hasAppliedEstimate,
    incomeForm,
    incomeMessage,
    incomeSources,
    isEstimateVisible,
    isIncomeHistoryOpen,
    isSavingIncome,
    resetIncomeEditor,
    setHasAppliedEstimate,
    setIncomeForm,
    setIsIncomeHistoryOpen,
    yearEnd,
  } = useBudgetApp();

  return (
    <>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Income Sources</p>
          <h2 id="income-heading">
            {editingIncomeSourceId ? 'Edit Income Source' : 'Add Income Source'}
          </h2>
        </div>
      </div>

      <form className="income-form" onSubmit={handleIncomeSubmit}>
        <label>
          Income source name
          <input
            name="name"
            onChange={handleIncomeChange}
            placeholder="ex. Campus job, Birthday gift, Yearly bonus"
            required
            type="text"
            value={incomeForm.name}
          />
        </label>

        <button
          aria-pressed={incomeForm.useTaxEstimate}
          className={`toggle-button ${incomeForm.useTaxEstimate ? 'active' : ''}`}
          onClick={handleEstimateToggle}
          type="button"
        >
          Estimate take-home pay after taxes?
        </button>

        <div className="income-form-grid">
          <label>
            Frequency
            <select name="frequency" onChange={handleIncomeChange} value={incomeForm.frequency}>
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {!incomeForm.useTaxEstimate && (
            <label>
              Expected Amount
              <input
                min="0.01"
                name="amount"
                onChange={handleIncomeChange}
                placeholder="750"
                required
                step="0.01"
                type="number"
                value={incomeForm.amount}
              />
            </label>
          )}
        </div>

        {incomeForm.useTaxEstimate && (
          <label>
            Pay style
            <select
              name="compensationType"
              onChange={handleIncomeChange}
              value={incomeForm.compensationType}
            >
              <option value="hourly">Hourly</option>
              <option value="salaried">Salaried</option>
            </select>
          </label>
        )}

        <label>
          {incomeForm.frequency === 'one_time' ? 'Income date' : 'First payday to track'}
          <input
            max={formatDateInput(yearEnd)}
            min={formatDateInput(accountStartMonth)}
            name="nextPayDate"
            onChange={handleIncomeChange}
            required
            type="date"
            value={incomeForm.nextPayDate}
          />
        </label>

        {isEstimateVisible && <IncomeEstimatePanel />}

        {incomeMessage && <p className="form-message">{incomeMessage}</p>}

        <div className={`form-actions ${editingIncomeSourceId ? 'is-editing' : ''}`}>
          <button type="submit" disabled={isSavingIncome}>
            {isSavingIncome
              ? 'Saving...'
              : editingIncomeSourceId
                ? 'Update Income Source'
                : 'Save Income Source'}
          </button>
          {editingIncomeSourceId && (
            <button type="button" className="secondary-button" onClick={resetIncomeEditor}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <section className="source-history">
        <button
          className="history-toggle"
          type="button"
          onClick={() => setIsIncomeHistoryOpen((isOpen) => !isOpen)}
        >
          <span>Income History</span>
          <small>{incomeSources.length} saved</small>
        </button>

        {isIncomeHistoryOpen && (
          <div className="income-list">
            {incomeSources.length === 0 ? (
              <p className="empty-state">No income sources added yet.</p>
            ) : (
              incomeSources.map((incomeSource) => (
                <article className="income-item" key={incomeSource.id}>
                  <div className="income-item-copy">
                    <h3>{incomeSource.name}</h3>
                    <p>
                      {getFrequencyLabel(incomeSource.frequency)} -{' '}
                      {incomeSource.useTaxEstimate
                        ? `${incomeSource.compensationType === 'salaried' ? 'Salaried' : 'Hourly'} take-home estimate`
                        : 'Direct amount'}
                    </p>
                    <span className="type-badge">
                      {incomeSource.frequency === 'one_time' ? 'One-time' : 'Recurring'}
                    </span>
                    <small>Next date: {formatLongDate(parseLocalDate(incomeSource.nextPayDate.slice(0, 10)))}</small>
                  </div>
                  <div className="income-item-actions">
                    <strong className="income-amount">{formatSignedCurrency(incomeSource.amount)}</strong>
                    <div className="history-actions">
                      <button type="button" className="secondary-button" onClick={() => handleEditIncomeSource(incomeSource)}>
                        Edit
                      </button>
                      <button type="button" className="secondary-button" onClick={() => handleDeleteIncomeSource(incomeSource)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </>
  );

  function IncomeEstimatePanel() {
    return (
      <section className="calculator-panel" aria-label="Pay estimate">
        {incomeForm.compensationType === 'hourly' ? (
          <div className="income-form-grid">
            <label>
              Hourly rate
              <input
                min="0.01"
                name="hourlyRate"
                onChange={handleIncomeChange}
                step="0.01"
                type="number"
                value={incomeForm.hourlyRate}
              />
            </label>

            <label>
              Hours per pay period
              <input
                min="0.1"
                name="hoursPerPeriod"
                onChange={handleIncomeChange}
                step="0.1"
                type="number"
                value={incomeForm.hoursPerPeriod}
              />
            </label>
          </div>
        ) : (
          <label>
            Gross paycheck amount
            <input
              min="0.01"
              name="grossAmount"
              onChange={handleIncomeChange}
              step="0.01"
              type="number"
              value={incomeForm.grossAmount}
            />
          </label>
        )}

        <label>
          Estimated tax rate %
          <input
            max="100"
            min="0"
            name="estimatedTaxRate"
            onChange={handleIncomeChange}
            step="0.1"
            type="number"
            value={incomeForm.estimatedTaxRate}
          />
        </label>

        <div className="estimate-strip">
          <div>
            <span>Estimated gross</span>
            <strong>{formatCurrency(estimatedGrossPay || 0)}</strong>
          </div>
          <div>
            <span>Estimated take-home</span>
            <strong>{formatCurrency(estimatedNetPay || 0)}</strong>
          </div>
          <button
            type="button"
            className={`secondary-button ${hasAppliedEstimate ? 'estimate-applied' : ''}`}
            onClick={() => {
              setIncomeForm((currentIncomeForm) => ({
                ...currentIncomeForm,
                amount: estimatedNetPay > 0 ? estimatedNetPay.toFixed(2) : currentIncomeForm.amount,
              }));
              setHasAppliedEstimate(true);
            }}
          >
            {hasAppliedEstimate ? 'Estimate Applied' : 'Use Estimate'}
          </button>
        </div>

        <p className={`estimate-note ${hasAppliedEstimate ? 'active' : ''}`}>
          {hasAppliedEstimate
            ? `Saving ${formatCurrency(estimatedNetPay || 0)} as the amount for this income source.`
            : 'Review the estimate, then apply it if you want this take-home amount saved.'}
        </p>
      </section>
    );
  }
}

function ExpensePlanner() {
  const {
    accountStartMonth,
    editingExpenseSourceId,
    expenseForm,
    expenseMessage,
    expenseSources,
    handleDeleteExpenseSource,
    handleEditExpenseSource,
    handleExpenseChange,
    handleExpenseSubmit,
    isExpenseHistoryOpen,
    isSavingExpense,
    resetExpenseEditor,
    setIsExpenseHistoryOpen,
    yearEnd,
  } = useBudgetApp();

  return (
    <section className="expense-placeholder" aria-labelledby="expense-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Expenses</p>
          <h2 id="expense-heading">{editingExpenseSourceId ? 'Edit Expense' : 'Add Expense'}</h2>
        </div>
      </div>

      <form className="income-form" onSubmit={handleExpenseSubmit}>
        <label>
          Expense name
          <input
            name="name"
            onChange={handleExpenseChange}
            placeholder="ex. Rent, groceries, phone bill"
            required
            type="text"
            value={expenseForm.name}
          />
        </label>

        <div className="income-form-grid">
          <label>
            Category
            <select name="category" onChange={handleExpenseChange} value={expenseForm.category}>
              {expenseCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Expense Type
            <select name="spendingType" onChange={handleExpenseChange} value={expenseForm.spendingType}>
              <option value="priority">Priority</option>
              <option value="essential">Essential</option>
              <option value="discretionary">Discretionary</option>
            </select>
          </label>

          {expenseForm.category === 'custom' && (
            <label>
              Custom category
              <input
                name="customCategory"
                onChange={handleExpenseChange}
                placeholder="ex. Pet care"
                required
                type="text"
                value={expenseForm.customCategory}
              />
            </label>
          )}

          <label>
            Frequency
            <select name="frequency" onChange={handleExpenseChange} value={expenseForm.frequency}>
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Expected Amount
            <input
              min="0.01"
              name="amount"
              onChange={handleExpenseChange}
              placeholder="75"
              required
              step="0.01"
              type="number"
              value={expenseForm.amount}
            />
          </label>
        </div>

        <label>
          {expenseForm.frequency === 'one_time' ? 'Expense date' : 'First due date to track'}
          <input
            max={formatDateInput(yearEnd)}
            min={formatDateInput(accountStartMonth)}
            name="nextDueDate"
            onChange={handleExpenseChange}
            required
            type="date"
            value={expenseForm.nextDueDate}
          />
        </label>

        {expenseMessage && <p className="form-message">{expenseMessage}</p>}

        <div className={`form-actions ${editingExpenseSourceId ? 'is-editing' : ''}`}>
          <button type="submit" disabled={isSavingExpense}>
            {isSavingExpense ? 'Saving...' : editingExpenseSourceId ? 'Update Expense' : 'Save Expense'}
          </button>
          {editingExpenseSourceId && (
            <button type="button" className="secondary-button" onClick={resetExpenseEditor}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      <section className="source-history">
        <button
          className="history-toggle"
          type="button"
          onClick={() => setIsExpenseHistoryOpen((isOpen) => !isOpen)}
        >
          <span>Expense History</span>
          <small>{expenseSources.length} saved</small>
        </button>

        {isExpenseHistoryOpen && (
          <div className="income-list">
            {expenseSources.length === 0 ? (
              <p className="empty-state">No expense sources added yet.</p>
            ) : (
              expenseSources.map((expenseSource) => (
                <article className="income-item expense-item" key={expenseSource.id}>
                  <div className="income-item-copy">
                    <h3>{expenseSource.name}</h3>
                    <p>
                      {expenseSource.category} - {formatExpenseType(expenseSource.spendingType)} -{' '}
                      {getFrequencyLabel(expenseSource.frequency)}
                    </p>
                    <span className="type-badge">
                      {expenseSource.frequency === 'one_time' ? 'One-time' : 'Recurring'}
                    </span>
                    <small>Next date: {formatLongDate(parseLocalDate(expenseSource.nextDueDate.slice(0, 10)))}</small>
                  </div>
                  <div className="income-item-actions">
                    <strong>{formatExpenseCurrency(expenseSource.amount)}</strong>
                    <div className="history-actions">
                      <button type="button" className="secondary-button" onClick={() => handleEditExpenseSource(expenseSource)}>
                        Edit
                      </button>
                      <button type="button" className="secondary-button" onClick={() => handleDeleteExpenseSource(expenseSource)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}
      </section>
    </section>
  );
}

function CalendarPanel() {
  const {
    calendarWeeks,
    canGoToNextMonth,
    canGoToPreviousMonth,
    displayedMonthEnd,
    displayedMonthLabel,
    navigateMonth,
    selectedDay,
    selectedMonth,
    selectedMonthRange,
    selectedWeekRange,
    setSelectedDay,
    setSelectedMonthRange,
    setSelectedWeekRange,
  } = useBudgetApp();

  return (
    <section className="calendar-panel" aria-labelledby="calendar-heading">
      <div className="panel-heading calendar-header">
        <button
          type="button"
          className="month-arrow"
          disabled={!canGoToPreviousMonth}
          onClick={() => navigateMonth(-1)}
        >
          ←
        </button>
        <div className="calendar-title">
          <p className="eyebrow">Calendar</p>
          <button
            className={`month-select-button ${selectedMonthRange ? 'active' : ''}`}
            type="button"
            onClick={() => {
              setSelectedDay(null);
              setSelectedWeekRange(null);
              setSelectedMonthRange((currentMonthRange) =>
                currentMonthRange &&
                isSameDay(currentMonthRange.start, selectedMonth) &&
                isSameDay(currentMonthRange.end, displayedMonthEnd)
                  ? null
                  : {
                      start: selectedMonth,
                      end: displayedMonthEnd,
                    },
              );
            }}
          >
            <span id="calendar-heading">{displayedMonthLabel}</span>
          </button>
        </div>
        <button
          type="button"
          className="month-arrow"
          disabled={!canGoToNextMonth}
          onClick={() => navigateMonth(1)}
        >
          →
        </button>
      </div>

      <div className="calendar-weekdays" aria-hidden="true">
        <span />
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((weekday) => (
          <span key={weekday}>{weekday}</span>
        ))}
      </div>

      <div className="calendar-grid">
        {calendarWeeks.map((calendarWeek, weekIndex) => (
          <CalendarWeek calendarWeek={calendarWeek} key={`week-${weekIndex}`} weekIndex={weekIndex} />
        ))}
      </div>
    </section>
  );

  function CalendarWeek({ calendarWeek, weekIndex }) {
    const weekRange = getCalendarWeekRange(calendarWeek);
    const isSelectedWeek =
      selectedWeekRange &&
      weekRange &&
      isSameDay(selectedWeekRange.start, weekRange.start) &&
      isSameDay(selectedWeekRange.end, weekRange.end);

    return (
      <div className={`calendar-week-row ${isSelectedWeek ? 'selected-week' : ''}`}>
        <button
          className="week-select-button"
          disabled={!weekRange}
          onClick={() => {
            if (!weekRange) {
              return;
            }

            setSelectedDay(null);
            setSelectedMonthRange(null);
            setSelectedWeekRange((currentWeekRange) =>
              currentWeekRange &&
              isSameDay(currentWeekRange.start, weekRange.start) &&
              isSameDay(currentWeekRange.end, weekRange.end)
                ? null
                : weekRange,
            );
          }}
          type="button"
        >
          Week {weekIndex + 1}
        </button>

        {calendarWeek.map((calendarDay, dayIndex) =>
          calendarDay ? (
            <CalendarDay calendarDay={calendarDay} key={calendarDay.date.toISOString()} />
          ) : (
            <div className="calendar-day empty" key={`empty-${weekIndex}-${dayIndex}`} />
          ),
        )}
      </div>
    );
  }

  function CalendarDay({ calendarDay }) {
    const previewItems = getCalendarPreviewItems(calendarDay);
    const hiddenItemCount =
      calendarDay.paydays.length + calendarDay.expenses.length + calendarDay.goals.length - previewItems.length;
    const isDayInSelectedWeek =
      selectedWeekRange && isDateInRange(calendarDay.date, selectedWeekRange.start, selectedWeekRange.end);

    return (
      <button
        type="button"
        className={`calendar-day ${calendarDay.isToday ? 'today' : ''} ${
          selectedDay && isSameDay(calendarDay.date, selectedDay) ? 'selected' : ''
        } ${isDayInSelectedWeek ? 'week-selected-day' : ''}`}
        onClick={() => {
          setSelectedMonthRange(null);
          setSelectedWeekRange(null);
          setSelectedDay((currentSelectedDay) =>
            currentSelectedDay && isSameDay(calendarDay.date, currentSelectedDay) ? null : calendarDay.date,
          );
        }}
      >
        <span>{calendarDay.date.getDate()}</span>
        {previewItems.map(({ item, type }) => (
          <CalendarPill item={item} key={`${type}-${item.eventId || item.incomeSourceId || item.expenseSourceId}-${item.date.toISOString()}`} type={type} />
        ))}
        {hiddenItemCount > 0 && <small className="calendar-see-more">+{hiddenItemCount} more</small>}
      </button>
    );
  }
}

function CalendarPill({ item, type }) {
  if (type === 'income') {
    return (
      <p className="calendar-pill income-pill">
        {item.name}: {formatSignedCurrency(item.amount)}
      </p>
    );
  }

  if (type === 'expense') {
    return (
      <p className={`calendar-pill expense-pill ${item.spendingType === 'priority' ? 'priority-pill' : ''}`}>
        {item.spendingType === 'priority' ? '🚨 ' : ''}
        {item.name}: {formatExpenseCurrency(item.amount)}
      </p>
    );
  }

  return (
    <p className="calendar-pill goal-pill">
      {item.type === 'payment' ? 'Saved' : item.type === 'contribution' ? 'Save' : item.type === 'paid_off' ? 'Paid 🎉' : 'Goal'}
      {item.type !== 'paid_off' && `: ${formatCurrency(item.type === 'deadline' ? item.remainingAmount : item.amount)}`}
    </p>
  );
}

function SelectionDetails() {
  const {
    confirmedExpensePayments,
    confirmedIncomePayments,
    detailActualExpenseTotal,
    detailActualGoalTotal,
    detailActualIncomeTotal,
    detailActualNetTotal,
    detailExpenses,
    detailGoalTotal,
    detailGoals,
    detailIncome,
    detailNetTotal,
    detailSelectionLabel,
    hasDetailSelection,
    handleConfirmGoalPayment,
    handleUnconfirmGoalPayment,
    selectedMonthRange,
    selectedWeekRange,
    today,
    toggleExpenseConfirmation,
    toggleIncomeConfirmation,
    unconfirmedExpensePayments,
    unconfirmedIncomePayments,
  } = useBudgetApp();

  return (
    <section className="day-panel" aria-labelledby="day-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">
            {selectedMonthRange ? 'Selected Month' : selectedWeekRange ? 'Selected Week' : 'Selected Day'}
          </p>
          <h2 id="day-heading">{detailSelectionLabel}</h2>
        </div>
      </div>

      <div className="day-detail-grid">
        <article className="day-detail-card net-detail-card">
          <h3>Net</h3>
          {!hasDetailSelection ? (
            <p className="empty-state">Select a day, week, or month to see net for that range.</p>
          ) : (
            <div className="net-detail-total">
              <strong>{formatCurrency(detailNetTotal)}</strong>
              <small>
                Income {formatSignedCurrency(sumAmounts(detailIncome))} - Expenses {formatExpenseCurrency(sumAmounts(detailExpenses))} - Goals{' '}
                {formatExpenseCurrency(detailGoalTotal)}
              </small>
              <small>
                Actual net {formatCurrency(detailActualNetTotal)} - Confirmed income {formatSignedCurrency(detailActualIncomeTotal)} - Confirmed expenses{' '}
                {formatExpenseCurrency(detailActualExpenseTotal)} - Confirmed goals {formatExpenseCurrency(detailActualGoalTotal)}
              </small>
            </div>
          )}
        </article>

        <DetailIncomeList
          confirmedPayments={confirmedIncomePayments}
          items={detailIncome}
          selectedMonthRange={selectedMonthRange}
          selectedWeekRange={selectedWeekRange}
          today={today}
          toggleIncomeConfirmation={toggleIncomeConfirmation}
          unconfirmedPayments={unconfirmedIncomePayments}
        />
        <DetailExpenseList
          confirmedPayments={confirmedExpensePayments}
          items={detailExpenses}
          selectedMonthRange={selectedMonthRange}
          selectedWeekRange={selectedWeekRange}
          today={today}
          toggleExpenseConfirmation={toggleExpenseConfirmation}
          unconfirmedPayments={unconfirmedExpensePayments}
        />
        <DetailGoalList
          goals={detailGoals}
          handleConfirmGoalPayment={handleConfirmGoalPayment}
          handleUnconfirmGoalPayment={handleUnconfirmGoalPayment}
          selectedMonthRange={selectedMonthRange}
          selectedWeekRange={selectedWeekRange}
        />
      </div>
    </section>
  );
}

function DetailIncomeList({ confirmedPayments, items, selectedMonthRange, selectedWeekRange, today, toggleIncomeConfirmation, unconfirmedPayments }) {
  if (items.length === 0) {
    return (
      <article className="day-detail-card">
        <h3>Income</h3>
        <p className="empty-state">No income scheduled for this selection yet.</p>
      </article>
    );
  }

  return (
    <article className="day-detail-card">
      <h3>Income</h3>
      <div className="detail-list">
        {items.map((income) => {
          const isConfirmed = isPaymentConfirmed(getIncomePaymentKey(income), income.date, confirmedPayments, unconfirmedPayments, today);

          return (
            <div className="day-detail-item" key={`${income.incomeSourceId}-${income.date.toISOString()}`}>
              <span>
                {selectedWeekRange || selectedMonthRange ? `${formatLongDate(income.date)} - ${income.name}` : income.name}
                <small>
                  {getFrequencyLabel(income.frequency)}
                  {income.frequency === 'one_time' ? ' - One-time' : ' - Recurring'} - {isConfirmed ? 'Actual' : 'Planned'}
                </small>
              </span>
              <div className="detail-actions">
                <strong className="income-amount">{formatSignedCurrency(income.amount)}</strong>
                <button type="button" className="secondary-button" onClick={() => toggleIncomeConfirmation(income)}>
                  {isConfirmed ? 'Unconfirm' : 'Confirm Paid'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function DetailExpenseList({ confirmedPayments, items, selectedMonthRange, selectedWeekRange, today, toggleExpenseConfirmation, unconfirmedPayments }) {
  if (items.length === 0) {
    return (
      <article className="day-detail-card">
        <h3>Expenses</h3>
        <p className="empty-state">No expenses scheduled for this selection yet.</p>
      </article>
    );
  }

  return (
    <article className="day-detail-card">
      <h3>Expenses</h3>
      <div className="detail-list">
        {items.map((expense) => {
          const isConfirmed = isPaymentConfirmed(getExpensePaymentKey(expense), expense.date, confirmedPayments, unconfirmedPayments, today);

          return (
            <div className="day-detail-item expense-detail-item" key={`${expense.expenseSourceId}-${expense.date.toISOString()}`}>
              <span>
                {selectedWeekRange || selectedMonthRange ? `${formatLongDate(expense.date)} - ${expense.name}` : expense.name}
                <small>
                  {expense.category} - {formatExpenseType(expense.spendingType)} -{' '}
                  {expense.frequency === 'one_time' ? 'One-time' : 'Recurring'} - {isConfirmed ? 'Actual' : 'Planned'}
                </small>
              </span>
              <div className="detail-actions">
                <strong>{formatExpenseCurrency(expense.amount)}</strong>
                <button type="button" className="secondary-button" onClick={() => toggleExpenseConfirmation(expense)}>
                  {isConfirmed ? 'Unconfirm' : 'Confirm Paid'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function DetailGoalList({ goals, handleConfirmGoalPayment, handleUnconfirmGoalPayment, selectedMonthRange, selectedWeekRange }) {
  if (goals.length === 0) {
    return (
      <article className="day-detail-card">
        <h3>Goals</h3>
        <p className="empty-state">No goals due for this selection yet.</p>
      </article>
    );
  }

  return (
    <article className="day-detail-card">
      <h3>Goals</h3>
      <div className="detail-list">
        {goals.map((goal) => (
          <div className="day-detail-item goal-detail-item" key={goal.eventId}>
            <span>
              {selectedWeekRange || selectedMonthRange ? `${formatLongDate(goal.date)} - ${goal.name}` : goal.name}
              <small>{getGoalDetailText(goal)}</small>
            </span>
            {goal.type === 'contribution' ? (
              <button type="button" className="secondary-button" onClick={() => handleConfirmGoalPayment(goal)}>
                Confirm Paid
              </button>
            ) : goal.type === 'payment' ? (
              <button type="button" className="secondary-button" onClick={() => handleUnconfirmGoalPayment(goal)}>
                Unconfirm
              </button>
            ) : goal.type === 'paid_off' ? (
              <strong>🎉</strong>
            ) : (
              <strong>{goal.estimatedDate ? formatLongDate(goal.estimatedDate) : 'Needs plan'}</strong>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

function formatExpenseType(spendingType) {
  if (spendingType === 'priority') {
    return 'Priority';
  }

  return spendingType === 'essential' ? 'Essential' : 'Discretionary';
}

function getGoalDetailText(goal) {
  if (goal.type === 'contribution') {
    return `${formatCurrency(goal.amount)} planned contribution`;
  }

  if (goal.type === 'payment') {
    return `${formatCurrency(goal.amount)} actual payment`;
  }

  if (goal.type === 'paid_off') {
    return 'Goal met';
  }

  return `${formatCurrency(goal.remainingAmount)} left by deadline`;
}

function sumAmounts(items) {
  return items.reduce((total, item) => total + item.amount, 0);
}
