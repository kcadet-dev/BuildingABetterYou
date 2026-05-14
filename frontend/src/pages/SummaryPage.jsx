import { useBudgetApp } from '../context/BudgetAppContext.jsx';
import {
  estimateGoalDateFromPlan,
  formatCurrency,
  formatDateInput,
  formatExpenseCurrency,
  formatLongDate,
  formatPercent,
  formatSignedCurrency,
  frequencyOptions,
  getFrequencyLabel,
  parseLocalDate,
} from '../lib/budgetHelpers.js';

export function SummaryPage() {
  return (
    <>
      <SummaryCards />
      <QuickStats />
      <section className="summary-layout">
        <section className="chart-grid">
          <IncomeChart />
          <ExpenseChart />
        </section>
        <BudgetOutlook />
      </section>
    </>
  );
}

function SummaryCards() {
  const {
    currentMonthActualNetTotal,
    currentMonthLabel,
    currentMonthNetTotal,
    workWeek,
    workWeekActualNetTotal,
    workWeekNetTotal,
    yearActualIncomeTotal,
    yearActualNetTotal,
    yearEnd,
    yearNetTotal,
    yearTotal,
  } = useBudgetApp();

  return (
    <section className="summary-grid" aria-label="Income summary">
      <article>
        <p className="eyebrow">This Year (Gross)</p>
        <strong>{formatCurrency(yearTotal)}</strong>
        <span>planned income through {formatLongDate(yearEnd)}</span>
        <small>Actual so far: {formatCurrency(yearActualIncomeTotal)}</small>
      </article>
      <article>
        <p className="eyebrow">This Week (Net)</p>
        <strong>{formatCurrency(workWeekNetTotal)}</strong>
        <span>
          {formatLongDate(workWeek.start)} to {formatLongDate(workWeek.end)}
        </span>
        <small>Actual net: {formatCurrency(workWeekActualNetTotal)}</small>
      </article>
      <article>
        <p className="eyebrow">This Month (Net)</p>
        <strong>{formatCurrency(currentMonthNetTotal)}</strong>
        <span>planned for {currentMonthLabel}</span>
        <small>Actual net: {formatCurrency(currentMonthActualNetTotal)}</small>
      </article>
      <article>
        <p className="eyebrow">This Year (Net)</p>
        <strong>{formatCurrency(yearNetTotal)}</strong>
        <span>planned through {formatLongDate(yearEnd)}</span>
        <small>Actual net: {formatCurrency(yearActualNetTotal)}</small>
      </article>
    </section>
  );
}

function QuickStats() {
  const { closestActiveGoal, currentMonthAvailableToBudget, currentMonthLabel, nextBillDue, nextPayday } = useBudgetApp();

  return (
    <section className="quick-stats-grid" aria-label="Dashboard quick stats">
      <article>
        <span>Next Payday</span>
        <strong>{nextPayday ? formatLongDate(nextPayday.date) : 'Not scheduled'}</strong>
        <small>{nextPayday ? `${nextPayday.name} ${formatSignedCurrency(nextPayday.amount)}` : 'Add income to see this.'}</small>
      </article>
      <article>
        <span>Next Bill Due</span>
        <strong>{nextBillDue ? formatLongDate(nextBillDue.date) : 'Not scheduled'}</strong>
        <small>{nextBillDue ? `${nextBillDue.name} ${formatExpenseCurrency(nextBillDue.amount)}` : 'Add expenses to see this.'}</small>
      </article>
      <article>
        <span>Closest Goal</span>
        <strong>{closestActiveGoal ? closestActiveGoal.name : 'No active goals'}</strong>
        <small>{closestActiveGoal ? `Due ${formatLongDate(parseLocalDate(closestActiveGoal.targetDate))}` : 'Completed goals move below.'}</small>
      </article>
      <article>
        <span>Available To Budget</span>
        <strong>{formatCurrency(currentMonthAvailableToBudget)}</strong>
        <small>Income - expenses - goals for {currentMonthLabel}</small>
      </article>
    </section>
  );
}

function IncomeChart() {
  const {
    chartConfirmedIncomeTotal,
    chartIncomeTotal,
    chartPeriodLabels,
    currentMonthTotal,
    incomeChartPeriod,
    incomePieTooltip,
    selectedDayTotal,
    selectedIncomeBreakdown,
    selectedMonthPie,
    setIncomeChartPeriod,
    workWeekTotal,
    yearTotal,
  } = useBudgetApp();

  return (
    <article className="chart-panel">
      <ChartHeading
        eyebrow="Expected Income"
        label={chartPeriodLabels[incomeChartPeriod]}
        onChange={setIncomeChartPeriod}
        value={incomeChartPeriod}
      />

      <div className="chart-body">
        <PieChart
          background={selectedMonthPie}
          title={incomePieTooltip}
          centerLabel="Planned"
          total={chartIncomeTotal}
          actual={chartConfirmedIncomeTotal}
        />
        <ChartLegend emptyText="No expected income in this period yet." items={selectedIncomeBreakdown} />
      </div>

      <div className="chart-period-totals income-period-totals">
        <PeriodTotal label="Selected Day" value={formatSignedCurrency(selectedDayTotal)} />
        <PeriodTotal
          label={incomeChartPeriod === 'yearly' ? 'This Month' : 'This Week'}
          value={formatSignedCurrency(incomeChartPeriod === 'yearly' ? currentMonthTotal : workWeekTotal)}
        />
        <PeriodTotal
          label={incomeChartPeriod === 'yearly' ? 'This Year' : 'This Month'}
          value={formatSignedCurrency(incomeChartPeriod === 'yearly' ? yearTotal : currentMonthTotal)}
        />
      </div>
    </article>
  );
}

function ExpenseChart() {
  const {
    chartConfirmedExpenseTotal,
    chartDiscretionaryExpenseTotal,
    chartEssentialExpenseTotal,
    chartExpenseTotal,
    chartPeriodLabels,
    currentMonthExpenseTotal,
    expenseChartPeriod,
    expensePie,
    expensePieTooltip,
    expenseTypePie,
    selectedDayExpenseTotal,
    selectedExpenseBreakdown,
    setExpenseChartPeriod,
    workWeekExpenseTotal,
    yearExpenseTotal,
  } = useBudgetApp();

  return (
    <article className="chart-panel">
      <ChartHeading
        eyebrow="Expected Expenses"
        label={chartPeriodLabels[expenseChartPeriod]}
        onChange={setExpenseChartPeriod}
        value={expenseChartPeriod}
      />

      <div className="chart-body">
        <div className="chart-pie-stack">
          <div className="expense-pie-shell" style={{ background: expenseTypePie }} title={expensePieTooltip}>
            <PieChart
              background={expensePie}
              className="expense-inner-pie"
              centerLabel="Planned"
              total={chartExpenseTotal}
              actual={chartConfirmedExpenseTotal}
            />
          </div>
          <div className="expense-ring-legend">
            <span>
              <i className="essential-dot" /> Essential{' '}
              {formatPercent(chartExpenseTotal === 0 ? 0 : chartEssentialExpenseTotal / chartExpenseTotal)}
            </span>
            <span>
              <i className="discretionary-dot" /> Discretionary{' '}
              {formatPercent(chartExpenseTotal === 0 ? 0 : chartDiscretionaryExpenseTotal / chartExpenseTotal)}
            </span>
          </div>
        </div>
        <ChartLegend emptyText="No expected expenses in this period yet." items={selectedExpenseBreakdown} />
      </div>

      <div className="chart-period-totals expense-period-totals">
        <PeriodTotal label="Selected Day" value={formatExpenseCurrency(selectedDayExpenseTotal)} />
        <PeriodTotal
          label={expenseChartPeriod === 'yearly' ? 'This Month' : 'This Week'}
          value={formatExpenseCurrency(expenseChartPeriod === 'yearly' ? currentMonthExpenseTotal : workWeekExpenseTotal)}
        />
        <PeriodTotal
          label={expenseChartPeriod === 'yearly' ? 'This Year' : 'This Month'}
          value={formatExpenseCurrency(expenseChartPeriod === 'yearly' ? yearExpenseTotal : currentMonthExpenseTotal)}
        />
      </div>
    </article>
  );
}

function ChartHeading({ eyebrow, label, onChange, value }) {
  return (
    <div className="panel-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{label}</h2>
      </div>
      <select className="chart-period-select" onChange={(event) => onChange(event.target.value)} value={value}>
        <option value="weekly">Weekly</option>
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
    </div>
  );
}

function PieChart({ actual, background, centerLabel, className = '', title = '', total }) {
  return (
    <div className={`pie-chart ${className}`.trim()} style={{ background }} title={title}>
      <div className="pie-chart-center">
        <span>{centerLabel}</span>
        <strong>{formatCurrency(total)}</strong>
        {actual !== undefined && <small>Actual {formatCurrency(actual)}</small>}
      </div>
    </div>
  );
}

function ChartLegend({ emptyText, items }) {
  if (items.length === 0) {
    return (
      <div className="chart-legend">
        <p className="empty-state">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="chart-legend">
      {items.map((item) => (
        <div className="legend-row" key={item.name}>
          <span className="legend-dot" style={{ background: item.color }} />
          <span className="legend-label">{item.name}</span>
          <strong>
            {formatCurrency(item.amount)}
            <small>{formatPercent(item.share)}</small>
          </strong>
        </div>
      ))}
    </div>
  );
}

function PeriodTotal({ label, value }) {
  return (
    <span>
      <small>{label}</small>
      <strong>{value}</strong>
    </span>
  );
}

function BudgetOutlook() {
  return (
    <section className="budget-panel" aria-labelledby="budget-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">B.A.B.Y. Snapshot</p>
          <h2 id="budget-heading">Budget Outlook</h2>
        </div>
      </div>

      <SnapshotCard />
      <BudgetLimits />
      <SavingsIdeas />
      <GoalsPanel />
    </section>
  );
}

function SnapshotCard() {
  const {
    displayedMonthActualExpenseTotal,
    displayedMonthActualGoalTotal,
    displayedMonthActualIncomeTotal,
    displayedMonthActualNetTotal,
    displayedMonthDiscretionaryExpenseTotal,
    displayedMonthEssentialExpenseTotal,
    displayedMonthExpenseTotal,
    displayedMonthGoalTotal,
    displayedMonthNetTotal,
    displayedMonthSpendingTypeTotal,
    displayedMonthTotal,
    netSnapshotPie,
    netSnapshotTooltip,
    spendingTypeSnapshotPie,
    spendingTypeTooltip,
  } = useBudgetApp();

  return (
    <section className="snapshot-grid" aria-label="Budget snapshot">
      <article className="snapshot-chart-card">
        <div className="snapshot-pie-grid">
          <div>
            <PieChart background={netSnapshotPie} className="snapshot-pie" centerLabel="Net" title={netSnapshotTooltip} total={displayedMonthNetTotal} />
            <p>Income vs expenses/goals</p>
          </div>

          <div>
            <PieChart background={spendingTypeSnapshotPie} className="snapshot-pie" centerLabel="Spend" title={spendingTypeTooltip} total={displayedMonthExpenseTotal} />
            <p>Essential vs discretionary</p>
          </div>
        </div>

        <div className="snapshot-lines">
          <SnapshotLine
            label="Income"
            detail={`Actual ${formatSignedCurrency(displayedMonthActualIncomeTotal)}`}
            value={formatSignedCurrency(displayedMonthTotal)}
            valueClassName="income-amount"
          />
          <div>
            <span>
              Expenses
              <small>Actual {formatExpenseCurrency(displayedMonthActualExpenseTotal)}</small>
              <small>
                Essential {formatExpenseCurrency(displayedMonthEssentialExpenseTotal)} - Discretionary{' '}
                {formatExpenseCurrency(displayedMonthDiscretionaryExpenseTotal + displayedMonthGoalTotal)}
                <br />
                {formatPercent(displayedMonthSpendingTypeTotal === 0 ? 0 : displayedMonthEssentialExpenseTotal / displayedMonthSpendingTypeTotal)} essential -{' '}
                {formatPercent(
                  displayedMonthSpendingTypeTotal === 0
                    ? 0
                    : (displayedMonthDiscretionaryExpenseTotal + displayedMonthGoalTotal) / displayedMonthSpendingTypeTotal,
                )} discretionary
              </small>
            </span>
            <strong className="expense-amount">{formatExpenseCurrency(displayedMonthExpenseTotal)}</strong>
          </div>
          <SnapshotLine
            label="Goals"
            detail={`Actual ${formatExpenseCurrency(displayedMonthActualGoalTotal)}`}
            value={formatExpenseCurrency(displayedMonthGoalTotal)}
            valueClassName="goal-amount"
          />
          <SnapshotLine
            label="Net Available"
            detail={`Actual ${formatCurrency(displayedMonthActualNetTotal)}`}
            value={formatCurrency(displayedMonthNetTotal)}
          />
        </div>
      </article>
    </section>
  );
}

function SnapshotLine({ detail, label, value, valueClassName = '' }) {
  return (
    <div>
      <span>
        {label}
        <small>{detail}</small>
      </span>
      <strong className={valueClassName}>{value}</strong>
    </div>
  );
}

function BudgetLimits() {
  const {
    budgetCategoryForm,
    budgetCategoryOptions,
    budgetCategorySummaries,
    budgetMessage,
    displayedMonthLabel,
    handleBudgetCategoryChange,
    handleBudgetCategorySubmit,
    handleDeleteBudgetCategory,
    isSavingBudgetLimit,
    overBudgetCategories,
  } = useBudgetApp();

  return (
    <section className="budget-limits-panel" aria-labelledby="budget-limits-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Budget Categories</p>
          <h2 id="budget-limits-heading">Monthly Limits</h2>
        </div>
      </div>

      <form className="budget-category-form" onSubmit={handleBudgetCategorySubmit}>
        <label>
          Category
          <select name="name" onChange={handleBudgetCategoryChange} value={budgetCategoryForm.name}>
            {budgetCategoryOptions.map((categoryName) => (
              <option key={categoryName} value={categoryName}>
                {categoryName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Monthly limit
          <input
            min="1"
            name="limit"
            onChange={handleBudgetCategoryChange}
            placeholder="300"
            required
            step="0.01"
            type="number"
            value={budgetCategoryForm.limit}
          />
        </label>
        <button disabled={isSavingBudgetLimit} type="submit">
          {isSavingBudgetLimit ? 'Saving...' : 'Save Limit'}
        </button>
      </form>
      {budgetMessage && <p className="form-message">{budgetMessage}</p>}

      <div className="budget-limit-list">
        {budgetCategorySummaries.length === 0 ? (
          <p className="empty-state">
            No monthly limits yet. Add one category limit here, then BABY Finance will compare it against your planned expenses for {displayedMonthLabel}.
          </p>
        ) : (
          budgetCategorySummaries.map((category) => (
            <article className={`budget-limit-card ${category.isOverBudget ? 'is-over-budget' : ''}`} key={category.id}>
              <div>
                <h3>{category.name}</h3>
                <p>
                  {formatCurrency(category.spent)} expected of {formatCurrency(category.limit)}
                </p>
                {category.isOverBudget && <small>Over budget by {formatCurrency(Math.abs(category.remaining))}</small>}
              </div>
              <button type="button" className="secondary-button" onClick={() => handleDeleteBudgetCategory(category.id)}>
                Delete
              </button>
            </article>
          ))
        )}
      </div>

      {overBudgetCategories.length > 0 && (
        <p className="budget-warning">
          Heads up: {overBudgetCategories.map((category) => category.name).join(', ')} over budget this month. Check the planned items before changing the limit.
        </p>
      )}
    </section>
  );
}

function SavingsIdeas() {
  const { discretionarySavingsItems, displayedMonthDiscretionaryExpenseTotal, displayedMonthLabel } = useBudgetApp();

  return (
    <section className="savings-panel" aria-label="Discretionary savings ideas">
      <div>
        <p className="eyebrow">Budget Costs</p>
        <h3>
          You may be able to find savings within {formatCurrency(displayedMonthDiscretionaryExpenseTotal)} of your current spend
        </h3>
      </div>

      {discretionarySavingsItems.length === 0 ? (
        <p className="empty-state">
          No discretionary spending is planned for {displayedMonthLabel} yet. Once you add dining, shopping, travel, or custom wants, ideas will show here.
        </p>
      ) : (
        <div className="savings-list">
          {discretionarySavingsItems.map((item) => (
            <article className="savings-card" key={item.name}>
              <div>
                <h4>{item.name}</h4>
                <p>Tip: {item.advice}</p>
              </div>
              <strong>{formatExpenseCurrency(item.amount)}</strong>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function GoalsPanel() {
  const {
    activeGoals,
    budgetGoalForm,
    canAllocateGoalNet,
    completedGoals,
    detailNetTotal,
    editingGoalId,
    goalMessage,
    handleAllocateGoalNet,
    handleBudgetGoalChange,
    handleBudgetGoalSubmit,
    handleDeleteGoal,
    handleEditGoal,
    resetGoalEditor,
    today,
  } = useBudgetApp();

  return (
    <section className="goals-panel" aria-labelledby="goals-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Goals</p>
          <h2 id="goals-heading">Possible Goals</h2>
        </div>
      </div>

      <GoalForm
        budgetGoalForm={budgetGoalForm}
        editingGoalId={editingGoalId}
        handleBudgetGoalChange={handleBudgetGoalChange}
        handleBudgetGoalSubmit={handleBudgetGoalSubmit}
        resetGoalEditor={resetGoalEditor}
        today={today}
      />
      {goalMessage && <p className="form-message">{goalMessage}</p>}

      <div className="goal-list">
        {activeGoals.length === 0 ? (
          <p className="empty-state">
            No active goals yet. Add a savings goal above when you want BABY Finance to track progress and planned payments.
          </p>
        ) : (
          activeGoals.map((goal) => (
            <GoalCard
              canAllocateGoalNet={canAllocateGoalNet}
              detailNetTotal={detailNetTotal}
              goal={goal}
              handleAllocateGoalNet={handleAllocateGoalNet}
              handleDeleteGoal={handleDeleteGoal}
              handleEditGoal={handleEditGoal}
              key={goal.id}
              today={today}
            />
          ))
        )}
      </div>

      <details className="completed-goals">
        <summary>Completed Goals ({completedGoals.length})</summary>
        <div className="goal-list">
          {completedGoals.length === 0 ? (
            <p className="empty-state">No completed goals yet.</p>
          ) : (
            completedGoals.map((goal) => (
              <CompletedGoalCard goal={goal} handleDeleteGoal={handleDeleteGoal} key={goal.id} />
            ))
          )}
        </div>
      </details>
    </section>
  );
}

function GoalForm({ budgetGoalForm, editingGoalId, handleBudgetGoalChange, handleBudgetGoalSubmit, resetGoalEditor, today }) {
  return (
    <form className="goal-form" onSubmit={handleBudgetGoalSubmit}>
      <label>
        Goal name
        <input
          name="name"
          onChange={handleBudgetGoalChange}
          placeholder="ex. Emergency fund"
          required
          type="text"
          value={budgetGoalForm.name}
        />
      </label>

      <label>
        Already saved
        <input
          min="0"
          name="currentAmount"
          onChange={handleBudgetGoalChange}
          placeholder="50"
          step="0.01"
          type="number"
          value={budgetGoalForm.currentAmount}
        />
      </label>

      <label>
        Target amount
        <input
          min="1"
          name="targetAmount"
          onChange={handleBudgetGoalChange}
          placeholder="500"
          required
          step="0.01"
          type="number"
          value={budgetGoalForm.targetAmount}
        />
      </label>

      <label>
        Needed by
        <input
          min={formatDateInput(today)}
          name="targetDate"
          onChange={handleBudgetGoalChange}
          required
          type="date"
          value={budgetGoalForm.targetDate}
        />
      </label>

      <label>
        {budgetGoalForm.contributionFrequency === 'one_time' ? 'One-time payment amount' : 'Planned payment'}
        <input
          min="0"
          name="contributionAmount"
          onChange={handleBudgetGoalChange}
          placeholder="20"
          step="0.01"
          type="number"
          value={budgetGoalForm.contributionAmount}
        />
      </label>

      <label>
        Payment frequency
        <select name="contributionFrequency" onChange={handleBudgetGoalChange} value={budgetGoalForm.contributionFrequency}>
          {frequencyOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        {budgetGoalForm.contributionFrequency === 'one_time' ? 'Payment date' : 'First payment date'}
        <input
          min={formatDateInput(today)}
          name="firstContributionDate"
          onChange={handleBudgetGoalChange}
          required
          type="date"
          value={budgetGoalForm.firstContributionDate}
        />
      </label>

      <button type="submit">{editingGoalId ? 'Update Goal' : 'Add Goal'}</button>
      {editingGoalId && (
        <button type="button" className="secondary-button" onClick={resetGoalEditor}>
          Cancel Edit
        </button>
      )}
    </form>
  );
}

function GoalCard({ canAllocateGoalNet, detailNetTotal, goal, handleAllocateGoalNet, handleDeleteGoal, handleEditGoal, today }) {
  const currentAmount = Number(goal.currentAmount || 0);
  const remainingAmount = Math.max(Number(goal.targetAmount) - currentAmount, 0);
  const estimatedDate = estimateGoalDateFromPlan(goal, today);
  const targetDate = parseLocalDate(goal.targetDate);
  const canMeetGoal = estimatedDate && estimatedDate <= targetDate;
  const progress = Math.min(100, (currentAmount / Number(goal.targetAmount)) * 100);
  const isPaidOff = remainingAmount <= 0;

  return (
    <article className={`goal-card ${isPaidOff ? 'is-paid-off' : ''}`}>
      <div className="goal-card-main">
        <div className="goal-card-title">
          <h3>{goal.name}</h3>
          {isPaidOff && <span className="paid-off-badge">Goal met 🎉</span>}
        </div>
        <p>
          {formatCurrency(remainingAmount)} left of {formatCurrency(goal.targetAmount)} by {formatLongDate(targetDate)}
        </p>
        <p>
          Plan: {formatCurrency(Number(goal.contributionAmount || 0))} {getFrequencyLabel(goal.contributionFrequency).toLowerCase()}
        </p>
        <progress value={progress} max="100">
          {Math.round(progress)}%
        </progress>
        <PaymentHistory payments={goal.payments || []} />
      </div>
      <div className={canMeetGoal ? 'goal-status is-on-track' : 'goal-status'}>
        {isPaidOff ? (
          <strong className="goal-met-status">Goal met 🎉</strong>
        ) : (
          <>
            <span>{estimatedDate ? 'Could be met by' : 'Needs payment plan'}</span>
            <strong>{estimatedDate ? formatLongDate(estimatedDate) : 'Not projected yet'}</strong>
          </>
        )}
        {canAllocateGoalNet && detailNetTotal >= remainingAmount && (
          <button type="button" className="secondary-button" onClick={() => handleAllocateGoalNet(goal)}>
            Allocate net
          </button>
        )}
        <button type="button" className="secondary-button" onClick={() => handleEditGoal(goal)}>
          Edit
        </button>
        <button type="button" className="secondary-button" onClick={() => handleDeleteGoal(goal)}>
          Delete
        </button>
      </div>
    </article>
  );
}

function CompletedGoalCard({ goal, handleDeleteGoal }) {
  const targetDate = parseLocalDate(goal.targetDate);

  return (
    <article className="goal-card is-paid-off">
      <div className="goal-card-main">
        <div className="goal-card-title">
          <h3>{goal.name}</h3>
          <span className="paid-off-badge">Goal met 🎉</span>
        </div>
        <p>
          {formatCurrency(goal.targetAmount)} goal completed
          {goal.completedAt ? ` on ${formatLongDate(parseLocalDate(goal.completedAt))}` : ''}
        </p>
        <p>Original deadline: {formatLongDate(targetDate)}</p>
        <progress value="100" max="100">
          100%
        </progress>
        <PaymentHistory payments={goal.payments || []} />
      </div>
      <div className="goal-status is-on-track">
        <strong className="goal-met-status">Goal met 🎉</strong>
        <button type="button" className="secondary-button" onClick={() => handleDeleteGoal(goal)}>
          Delete
        </button>
      </div>
    </article>
  );
}

function PaymentHistory({ payments }) {
  return (
    <details className="payment-history">
      <summary>Payments made ({payments.length})</summary>
      {payments.length === 0 ? (
        <p>No goal payments confirmed yet.</p>
      ) : (
        payments.map((payment) => (
          <div className="payment-history-row" key={payment.id}>
            <span>{formatLongDate(parseLocalDate(payment.date))}</span>
            <strong>{formatSignedCurrency(payment.amount)}</strong>
          </div>
        ))
      )}
    </details>
  );
}
