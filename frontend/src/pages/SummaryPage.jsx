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
    currentMonthLabel,
    currentMonthNetTotal,
    workWeek,
    workWeekNetTotal,
    yearActualIncomeTotal,
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
      </article>
      <article>
        <p className="eyebrow">This Month (Net)</p>
        <strong>{formatCurrency(currentMonthNetTotal)}</strong>
        <span>planned for {currentMonthLabel}</span>
      </article>
      <article>
        <p className="eyebrow">This Year (Net)</p>
        <strong>{formatCurrency(yearNetTotal)}</strong>
        <span>planned through {formatLongDate(yearEnd)}</span>
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

      <ChartSummaryNote
        tone="income"
        primaryLabel="Selected Day"
        primaryValue={formatSignedCurrency(selectedDayTotal)}
        secondaryLabel={incomeChartPeriod === 'yearly' ? 'This Month' : 'This Week'}
        secondaryValue={formatSignedCurrency(incomeChartPeriod === 'yearly' ? currentMonthTotal : workWeekTotal)}
        tertiaryLabel={incomeChartPeriod === 'yearly' ? 'This Year' : 'This Month'}
        tertiaryValue={formatSignedCurrency(incomeChartPeriod === 'yearly' ? yearTotal : currentMonthTotal)}
      />
    </article>
  );
}

function ExpenseChart() {
  const {
    chartConfirmedExpenseTotal,
    chartDiscretionaryExpenseTotal,
    chartEssentialExpenseTotal,
    chartExpenseTotal,
    chartPriorityExpenseTotal,
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
              <i className="priority-dot" /> Priority{' '}
              {formatPercent(chartExpenseTotal === 0 ? 0 : chartPriorityExpenseTotal / chartExpenseTotal)}
            </span>
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

      <ChartSummaryNote
        tone="expense"
        primaryLabel="Selected Day"
        primaryValue={formatExpenseCurrency(selectedDayExpenseTotal)}
        secondaryLabel={expenseChartPeriod === 'yearly' ? 'This Month' : 'This Week'}
        secondaryValue={formatExpenseCurrency(expenseChartPeriod === 'yearly' ? currentMonthExpenseTotal : workWeekExpenseTotal)}
        tertiaryLabel={expenseChartPeriod === 'yearly' ? 'This Year' : 'This Month'}
        tertiaryValue={formatExpenseCurrency(expenseChartPeriod === 'yearly' ? yearExpenseTotal : currentMonthExpenseTotal)}
      />
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

function ChartSummaryNote({
  primaryLabel,
  primaryValue,
  secondaryLabel,
  secondaryValue,
  tertiaryLabel,
  tertiaryValue,
  tone,
}) {
  return (
    <div className={`chart-summary-note ${tone === 'expense' ? 'is-expense' : 'is-income'}`}>
      <SummaryChip label={primaryLabel} value={primaryValue} />
      <SummaryChip label={secondaryLabel} value={secondaryValue} />
      <SummaryChip label={tertiaryLabel} value={tertiaryValue} />
    </div>
  );
}

function SummaryChip({ label, value }) {
  return (
    <div className="chart-summary-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
    displayedMonthActualIncomeTotal,
    displayedMonthActualNetTotal,
    displayedMonthDiscretionaryExpenseTotal,
    displayedMonthEssentialExpenseTotal,
    displayedMonthExpenseTotal,
    displayedMonthGoalTotal,
    displayedMonthNetTotal,
    displayedMonthPriorityExpenseTotal,
    displayedMonthSpendingTypeTotal,
    displayedMonthTotal,
    netSnapshotActualTotal,
    netSnapshotLabel,
    netSnapshotPeriod,
    netSnapshotPlannedTotal,
    setNetSnapshotPeriod,
    spendingTypeSnapshotPie,
    spendingTypeSnapshotItems,
    spendingTypeTooltip,
  } = useBudgetApp();
  const flexibleSpendTotal = displayedMonthDiscretionaryExpenseTotal + displayedMonthGoalTotal;
  const essentialShare =
    displayedMonthSpendingTypeTotal === 0
      ? 0
      : (displayedMonthPriorityExpenseTotal + displayedMonthEssentialExpenseTotal) / displayedMonthSpendingTypeTotal;
  const flexibleShare =
    displayedMonthSpendingTypeTotal === 0 ? 0 : flexibleSpendTotal / displayedMonthSpendingTypeTotal;

  return (
    <section className="snapshot-grid" aria-label="Budget snapshot">
      <article className="snapshot-chart-card">
        <div className="snapshot-pie-grid">
          <NetBalanceCard
            actual={netSnapshotActualTotal}
            label={netSnapshotLabel}
            period={netSnapshotPeriod}
            planned={netSnapshotPlannedTotal}
            setPeriod={setNetSnapshotPeriod}
          />

          <div className="snapshot-pie-panel">
            <PieChart background={spendingTypeSnapshotPie} className="snapshot-pie" centerLabel="Spend" title={spendingTypeTooltip} total={displayedMonthExpenseTotal} />
            <p>Priority, essential, and discretionary</p>
            <div className="snapshot-mini-legend">
              {spendingTypeSnapshotItems.map((item) => (
                <span key={item.name}>
                  <i style={{ background: item.color }} />
                  {item.name} {formatPercent(item.share)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="snapshot-metrics">
          <SnapshotMetric
            label="Available to budget"
            detail={`Actual ${formatCurrency(displayedMonthActualNetTotal)}`}
            value={formatCurrency(displayedMonthNetTotal)}
            valueClassName={displayedMonthNetTotal >= 0 ? 'income-amount' : 'expense-amount'}
          />
          <SnapshotMetric
            label="Priority + essential"
            detail={`${formatPercent(essentialShare)} of planned outflow`}
            value={formatExpenseCurrency(displayedMonthPriorityExpenseTotal + displayedMonthEssentialExpenseTotal)}
            valueClassName="expense-amount"
          />
          <SnapshotMetric
            label="Flexible spending + goals"
            detail={`${formatPercent(flexibleShare)} of planned outflow`}
            value={formatExpenseCurrency(flexibleSpendTotal)}
            valueClassName="goal-amount"
          />
          <SnapshotMetric
            label="Income this month"
            detail={`Actual ${formatSignedCurrency(displayedMonthActualIncomeTotal)}`}
            value={formatSignedCurrency(displayedMonthTotal)}
            valueClassName="income-amount"
          />
        </div>
      </article>
    </section>
  );
}

function NetBalanceCard({ actual, label, period, planned, setPeriod }) {
  const largestMagnitude = Math.max(Math.abs(planned), Math.abs(actual), 1);
  const plannedState = planned >= 0 ? 'positive' : 'negative';
  const actualState =
    actual >= 0
      ? 'positive'
      : planned >= 0
        ? 'caution'
        : 'negative';
  const statusMessage =
    planned >= 0 && actual < 0
      ? 'Expected net is still in the green, but confirmed spending suggests money could get tight before your next payday.'
      : planned < 0 && actual >= 0
        ? 'Expected net is in the red, but confirmed activity is currently in the green.'
        : planned >= 0
          ? 'Expected and confirmed net are both in the green for this range.'
          : 'Expected and confirmed net are both in the red for this range.';

  return (
    <div className="snapshot-balance-panel">
      <div className="snapshot-balance-heading">
        <div>
          <span className="eyebrow">Net Balance</span>
          <h3>{label}</h3>
        </div>
        <select
          className="chart-period-select"
          onChange={(event) => setPeriod(event.target.value)}
          value={period}
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <BalanceBarRow
        label="Expected Net"
        magnitude={largestMagnitude}
        state={plannedState}
        value={planned}
      />
      <BalanceBarRow
        label="Confirmed Net"
        magnitude={largestMagnitude}
        state={actualState}
        value={actual}
      />

      <p className={`balance-status is-${actualState}`}>{statusMessage}</p>
    </div>
  );
}

function BalanceBarRow({ label, magnitude, state, value }) {
  const share = `${Math.max((Math.abs(value) / magnitude) * 100, 4)}%`;
  const directionClassName = `is-${state}`;

  return (
    <div className="balance-bar-row">
      <div className="balance-bar-meta">
        <span>{label}</span>
        <strong className={directionClassName}>
          {formatSignedCurrency(value)}
        </strong>
      </div>

      <div className="balance-bar-track" role="img" aria-label={`${label} net ${formatSignedCurrency(value)}`}>
        <div className="balance-bar-axis" />
        <div className={`balance-bar-fill ${directionClassName}`} style={{ width: share }} />
      </div>
    </div>
  );
}

function SnapshotMetric({ detail, label, value, valueClassName = '' }) {
  return (
    <div className="snapshot-metric">
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
    <details className="budget-limits-panel summary-dropdown">
      <summary>
        <div>
          <p className="eyebrow" id="budget-limits-heading">Monthly Limits</p>
        </div>
      </summary>

      <div className="summary-dropdown-content">
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
          Heads up: {overBudgetCategories.map((category) => category.name).join(', ')} {overBudgetCategories.length === 1 ? 'is' : 'are'} over budget this month. Review the planned expenses in {overBudgetCategories.length === 1 ? 'that category' : 'those categories'} before raising the limit.
        </p>
      )}
      </div>
    </details>
  );
}

function SavingsIdeas() {
  const { discretionarySavingsItems, displayedMonthDiscretionaryExpenseTotal, displayedMonthLabel } = useBudgetApp();

  return (
    <details className="savings-panel savings-dropdown">
      <summary>
        <div>
          <p className="eyebrow">Potential Savings</p>
        </div>
      </summary>

      <div className="savings-dropdown-content">
        <h3>
          You may be able to find savings within {formatCurrency(displayedMonthDiscretionaryExpenseTotal)} of your current spend
        </h3>
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
      </div>
    </details>
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
    <details className="goals-panel summary-dropdown">
      <summary>
        <div>
          <p className="eyebrow">Goals</p>
        </div>
      </summary>

      <div className="summary-dropdown-content">
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
      </div>
    </details>
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
